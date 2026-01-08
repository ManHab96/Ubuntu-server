from datetime import datetime
from uuid import uuid4
from database import appointments_collection
from models import AppointmentStatus

async def create_appointment_from_ai(
    agency_id: str,
    customer_id: str,
    appointment_date: datetime,
    car_id: str | None = None,
    notes: str | None = None
):
    appointment = {
        "id": str(uuid4()),
        "agency_id": agency_id,
        "customer_id": customer_id,
        "car_id": car_id,
        "appointment_date": appointment_date,
        "status": AppointmentStatus.PENDING,
        "notes": notes,
        "created_at": datetime.utcnow()
    }

    await appointments_collection.insert_one(appointment)
    return appointment
