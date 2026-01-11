from datetime import datetime, timedelta
import uuid
import re
from typing import Literal

from database import (
    conversations_collection,
    messages_collection,
    customers_collection,
    agencies_collection,
)
from models import AppointmentCreate
from services.appointment_service import create_appointment
from services.conversation_state_service import (
    get_conversation_state,
    update_conversation_state
)

# ======================================================
# Utilidades internas
# ======================================================

DEFAULT_STATE = {
    "intent": None,            # appointment | info | None
    "step": None,              # date | time | confirm
    "data": {
        "date": None,
        "time": None,
        "car_id": None,
        "agency_id": None
    },
    "confirmed": False
}


def _merge_state(old: dict | None, new: dict) -> dict:
    if not old:
        return new
    merged = old.copy()
    merged.update(new)
    return merged


# ======================================================
# Entrada única de conversación
# ======================================================

async def handle_conversation_message(
    *,
    agency_id: str,
    message: str,
    channel: Literal["whatsapp", "test_chat"],
    from_phone: str | None = None,
    conversation_id: str | None = None,
) -> dict:
    """
    Punto ÚNICO de entrada para cualquier canal.
    Regresa:
    {
        "conversation_id": str,
        "response": str
    }
    """

    # ----------------------------------------------
    # 1. Cliente
    # ----------------------------------------------
    customer_id = None
    if from_phone:
        customer = await customers_collection.find_one(
            {"phone": from_phone, "agency_id": agency_id}
        )
        if not customer:
            customer_id = str(uuid.uuid4())
            await customers_collection.insert_one({
                "id": customer_id,
                "agency_id": agency_id,
                "name": from_phone,
                "phone": from_phone,
                "source": channel,
                "created_at": datetime.utcnow()
            })
        else:
            customer_id = customer["id"]

    # ----------------------------------------------
    # 2. Conversación
    # ----------------------------------------------
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        await conversations_collection.insert_one({
            "id": conversation_id,
            "agency_id": agency_id,
            "customer_id": customer_id,
            "whatsapp_phone": from_phone,
            "created_at": datetime.utcnow(),
            "last_message": message,
            "last_message_at": datetime.utcnow()
        })
    else:
        await conversations_collection.update_one(
            {"id": conversation_id},
            {"$set": {
                "last_message": message,
                "last_message_at": datetime.utcnow()
            }}
        )

    # ----------------------------------------------
    # 3. Guardar mensaje
    # ----------------------------------------------
    await messages_collection.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": True,
        "message_text": message,
        "timestamp": datetime.utcnow()
    })

    # ----------------------------------------------
    # 4. Estado
    # ----------------------------------------------
    state = await get_conversation_state(conversation_id)
    if not state:
        state = DEFAULT_STATE.copy()
        state["data"]["agency_id"] = agency_id

    # ----------------------------------------------
    # 5. Intento simple (cita)
    # ----------------------------------------------
    if state["intent"] is None:
        if any(w in message.lower() for w in ["cita", "agendar", "visitar"]):
            state["intent"] = "appointment"
            state["step"] = "date"
            await update_conversation_state(conversation_id, state)
            return {
                "conversation_id": conversation_id,
                "response": "¡Perfecto! ¿Qué día te gustaría venir?"
            }

    # ----------------------------------------------
    # 6. Flujo de cita
    # ----------------------------------------------
    if state["intent"] == "appointment":

        # Fecha
        if state["step"] == "date":
            parsed_date = _extract_date(message)
            if not parsed_date:
                return {
                    "conversation_id": conversation_id,
                    "response": "¿Me indicas el día de tu visita? (ej. mañana, viernes, 12 de mayo)"
                }
            state["data"]["date"] = parsed_date
            state["step"] = "time"
            await update_conversation_state(conversation_id, state)
            return {
                "conversation_id": conversation_id,
                "response": "Perfecto 👍 ¿A qué hora te gustaría?"
            }

        # Hora
        if state["step"] == "time":
            parsed_time = _extract_time(message)
            if not parsed_time:
                return {
                    "conversation_id": conversation_id,
                    "response": "¿Qué hora te funciona? (ej. 10:30, 4 pm)"
                }
            state["data"]["time"] = parsed_time
            state["step"] = "confirm"
            await update_conversation_state(conversation_id, state)

            return {
                "conversation_id": conversation_id,
                "response": (
                    "Confírmame por favor:\n\n"
                    f"📅 Fecha: {state['data']['date']}\n"
                    f"🕐 Hora: {state['data']['time']}\n\n"
                    "¿Confirmamos la cita? (sí / no)"
                )
            }

        # Confirmación
        if state["step"] == "confirm":
            if message.lower() not in ["sí", "si", "confirmar", "ok"]:
                state["step"] = "date"
                await update_conversation_state(conversation_id, state)
                return {
                    "conversation_id": conversation_id,
                    "response": "Sin problema 😊 ¿Qué día prefieres entonces?"
                }

            # Crear cita
            appointment_dt = datetime.fromisoformat(
                f"{state['data']['date']}T{state['data']['time']}"
            )

            appointment = await create_appointment(
                AppointmentCreate(
                    agency_id=agency_id,
                    customer_id=customer_id,
                    appointment_date=appointment_dt,
                    notes="Cita creada por IA",
                    created_by_ai=True,
                    ai_prompt=message,
                    ai_extracted_data={"source": channel}
                )
            )

            state["confirmed"] = True
            await update_conversation_state(conversation_id, state)

            agency = await agencies_collection.find_one({"id": agency_id})

            response = (
                "✅ ¡Cita confirmada!\n\n"
                f"📅 {appointment_dt.strftime('%d/%m/%Y')}\n"
                f"🕐 {appointment_dt.strftime('%H:%M')}\n"
            )

            if agency and agency.get("address"):
                response += f"\n📍 {agency['address']}"

            return {
                "conversation_id": conversation_id,
                "response": response
            }

    # ----------------------------------------------
    # 7. Fallback IA general
    # ----------------------------------------------
    #ai_text = await generate_ai_response(
    #    agency_id=agency_id,
     #   conversation_id=conversation_id,
     #   user_message=message
    #)

    #return {
     #   "conversation_id": conversation_id,
      #  "response": ai_text
    #}

# ----------------------------------------------
# 7. Fallback controlado
# ----------------------------------------------
    return {
        "conversation_id": conversation_id,
        "response": "Perfecto 😊 ¿En qué más puedo ayudarte?"
    }


# ======================================================
# Extractores simples
# ======================================================

def _extract_date(text: str) -> str | None:
    text = text.lower()
    today = datetime.utcnow().date()


    match = re.search(r"(\d{1,2})[/-](\d{1,2})", text)
    if match:
        day, month = map(int, match.groups())
        year = today.year
        return datetime(year, month, day).date().isoformat()

    return None


def _extract_time(text: str) -> str | None:
    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", text.lower())
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    period = match.group(3)

    if period == "pm" and hour < 12:
        hour += 12

    return f"{hour:02d}:{minute:02d}"
