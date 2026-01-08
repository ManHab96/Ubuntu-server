import asyncio
from services.ai_service import handle_ai_action

async def test():
    await handle_ai_action(
        action="create_appointment",
        data={
            "appointment_date": "2026-01-10T12:00:00",
            "notes": "Prueba directa async"
        },
        agency_id="AGENCY_ID",
        customer_id="CUSTOMER_ID"
    )

asyncio.run(test())
