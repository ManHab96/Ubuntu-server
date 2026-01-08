# backend/services/ai_service.py

from services.appointment_service import create_appointment_from_ai
from datetime import datetime


async def handle_ai_action(action: dict) -> dict:
    """
    Maneja acciones generadas por la IA.
    Retorna siempre un dict entendible por WhatsApp.
    """

    if not action or "type" not in action:
        return {
            "type": "send_message",
            "message": "No entendí tu solicitud, ¿podrías repetirla por favor?"
        }

    action_type = action["type"]
    data = action.get("data", {})

    # ─────────────────────────────────────────────
    # 🗓️ CREAR CITA
    # ─────────────────────────────────────────────
    if action_type == "create_appointment":
        appointment = await create_appointment_from_ai(data)

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
                "📍 Te esperamos en la agencia.\n\n"
                "Si necesitas cambiar la fecha o tienes alguna duda, "
                "solo dime y con gusto te ayudo 😊"
            )
        }

    # ─────────────────────────────────────────────
    # ❓ ACCIÓN NO SOPORTADA
    # ─────────────────────────────────────────────
    return {
        "type": "send_message",
        "message": "Aún no puedo realizar esa acción, pero puedo ayudarte con información."
    }
