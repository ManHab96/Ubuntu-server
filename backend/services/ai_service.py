# backend/services/ai_service.py

from services.appointment_service import create_appointment_from_ai
from datetime import datetime


async def handle_ai_action(action: dict) -> dict:
    """
    Maneja acciones generadas por la IA.
    """

    # 🔥 NORMALIZAMOS
    action_type = action.get("action") or action.get("type")
    data = action.get("data", {})

    if not action_type:
        return {
            "type": "send_message",
            "message": "No entendí tu solicitud, ¿podrías repetirla?"
        }

    # ─────────────────────────────
    # 🗓️ CREAR CITA
    # ─────────────────────────────
    if action_type == "create_appointment":
        customer_id = data.get("customer_id")
        appointment_date = data.get("appointment_date")

        if not customer_id or not appointment_date:
            return {
                "type": "send_message",
                "message": "Falta información para crear la cita."
            }

        appointment = await create_appointment_from_ai(
            customer_id=customer_id,
            appointment_date=appointment_date
        )

        fecha = appointment["appointment_date"]
        fecha_legible = (
            fecha.strftime("%d/%m/%Y a las %H:%M")
            if isinstance(fecha, datetime)
            else fecha
        )

        return {
            "type": "send_message",
            "message": (
                "✅ *¡Tu cita ha sido agendada con éxito!*\n\n"
                f"📅 Fecha: {fecha_legible}\n"
                "📍 Te esperamos en la agencia."
            )
        }

    return {
        "type": "send_message",
        "message": "Acción no soportada todavía."
    }
