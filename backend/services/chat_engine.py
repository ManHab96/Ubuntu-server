# services/chat_engine.py

import uuid
from datetime import datetime
from database import (
    conversations_collection,
    messages_collection,
    )
from services.ai_service import handle_ai_action
from routes.whatsapp import (
    detect_and_create_appointment,
    generate_ai_response
)
import json
import re
from services.customer_service import get_or_create_customer
from models import LeadSource

def extract_json_from_ai(text: str) -> dict | None:
    if not text:
        return None

    cleaned = re.sub(r"```json|```", "", text).strip()

    # fuerza cierre si viene truncado
    if cleaned.count("{") > cleaned.count("}"):
        cleaned += "}"

    try:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            return None
        return json.loads(match.group())
    except Exception as e:
        print("❌ JSON PARSE ERROR:", e)
        print("RAW:", cleaned)
        return None


async def handle_chat_message(
    agency_id: str,
    customer_identifier: str,
    message_text: str,
    is_test: bool = False
):
    """
    customer_identifier:
      - phone (whatsapp)
      - test_user_id (frontend)
    """

    # 1. Cliente (UNIFICADO)
    customer = await get_or_create_customer(
        agency_id=agency_id,
        phone=customer_identifier,
        source=LeadSource.WHATSAPP
    )

    customer_id = customer["id"]


    # 2. Conversación
    conversation = await conversations_collection.find_one({
        "agency_id": agency_id,
        "customer_id": customer_id
    })

    if not conversation:
        conversation_id = str(uuid.uuid4())
        await conversations_collection.insert_one({
            "id": conversation_id,
            "agency_id": agency_id,
            "customer_id": customer_id,
            "created_at": datetime.utcnow()
        })
    else:
        conversation_id = conversation["id"]

    # 3. Guardar mensaje entrante
    await messages_collection.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": True,
        "message_text": message_text,
        "timestamp": datetime.utcnow()
    })

    # 4. Intento cita
    appointment = await detect_and_create_appointment(
        agency_id,
        customer_id,
        message_text,
        conversation_id
    )

    if appointment:
        response_text = (
            f"✅ Cita creada\n📅 {appointment['date']} 🕐 {appointment['time']}"
        )
    else:
        ai_response = await generate_ai_response(
            agency_id,
            conversation_id,
            message_text
        )

        action_payload = extract_json_from_ai(ai_response)

        if action_payload and action_payload.get("action") == "create_appointment":
            appointment_date = action_payload.get("appointment_date")

    # 🛑 VALIDACIÓN CRÍTICA
            if not appointment_date or len(appointment_date) < 16:
                response_text = (
                    "❌ No pude confirmar correctamente la fecha de la cita.\n"
                    "¿Puedes repetirla con día y hora?"
                )
            else:
                normalized_action = {
                    "action": "create_appointment",
                    "data": {
                    "customer_id": customer_id,
                    "appointment_date": appointment_date,
                    "notes": action_payload.get("notes")
                }
            }

            result = await handle_ai_action(normalized_action)
            response_text = result["message"]

        else:
            response_text = ai_response


    # 5. Guardar respuesta
    await messages_collection.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "from_customer": False,
        "message_text": response_text,
        "timestamp": datetime.utcnow()
    })

    return response_text, conversation_id
