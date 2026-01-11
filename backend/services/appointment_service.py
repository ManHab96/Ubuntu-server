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

#Codigo nuevo
from models import Appointment, AppointmentCreate
from datetime import datetime
import uuid

async def create_appointment(payload: AppointmentCreate) -> Appointment:
    appointment_id = str(uuid.uuid4())

    appointment_dict = {
        "id": appointment_id,
        "agency_id": payload.agency_id,
        "customer_id": payload.customer_id,
        "car_id": payload.car_id,
        "appointment_date": payload.appointment_date,
        "status": "pending",
        "notes": payload.notes,
        "created_by_ai": payload.created_by_ai,
        "ai_prompt": payload.ai_prompt,
        "ai_extracted_data": payload.ai_extracted_data,
        "created_at": datetime.utcnow()
    }

    await appointments_collection.insert_one(appointment_dict)

    return Appointment(**appointment_dict)
