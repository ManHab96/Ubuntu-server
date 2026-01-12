from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Appointment, AppointmentCreate, AppointmentStatus, AppointmentReschedule
from database import appointments_collection
from auth import get_current_user
import uuid
from datetime import datetime, timedelta
from services.cleanup import cleanup_old_cancelled_appointments

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.post("/", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    # Check for overlapping appointments
    appointment_time = appointment.appointment_date
    time_window_start = appointment_time - timedelta(minutes=30)
    time_window_end = appointment_time + timedelta(minutes=30)
    
    overlapping = await appointments_collection.find_one({
        "agency_id": appointment.agency_id,
        "appointment_date": {
            "$gte": time_window_start,
            "$lte": time_window_end
        },
        "status": {"$in": [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]}
    })
    
    if overlapping:
        raise HTTPException(status_code=400, detail="Time slot already taken")
    
    appointment_id = str(uuid.uuid4())
    
    appointment_dict = {
        "id": appointment_id,
        **appointment.model_dump(),
        "status": AppointmentStatus.PENDING,
        "created_at": datetime.utcnow()
    }
    
    await appointments_collection.insert_one(appointment_dict)
    return Appointment(**appointment_dict)

@router.get("/", response_model=List[Appointment])
async def get_appointments(
    agency_id: str = None,
    status: str = None,
    current_user = Depends(get_current_user)
):
    query = {
        "deleted_at": {"$exists": False}
    }

    if agency_id:
        query["agency_id"] = agency_id
    if status:
        query["status"] = status

    appointments = await appointments_collection.find(
        query,
        {"_id": 0}
    ).to_list(1000)

    return [Appointment(**appt) for appt in appointments]


@router.get("/today")
async def get_today_appointments(agency_id: str, current_user: dict = Depends(get_current_user)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    appointments = await appointments_collection.find({
        "agency_id": agency_id,
        "appointment_date": {
            "$gte": today_start,
            "$lt": today_end
        }
    }, {"_id": 0}).to_list(1000)
    
    return [Appointment(**appt) for appt in appointments]

@router.get("/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await appointments_collection.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return Appointment(**appointment)

@router.patch("/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: AppointmentStatus, current_user: dict = Depends(get_current_user)):
    result = await appointments_collection.update_one({"id": appointment_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment status updated"}

@router.patch("/{appointment_id}", response_model=Appointment)
async def reschedule_appointment(
    appointment_id: str,
    data: AppointmentReschedule,  # 👈 BODY
    current_user: dict = Depends(get_current_user)
):
    appointment = await appointments_collection.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_time = data.appointment_date

    # Validar solapamiento
    time_window_start = new_time - timedelta(minutes=30)
    time_window_end = new_time + timedelta(minutes=30)

    overlapping = await appointments_collection.find_one({
        "agency_id": appointment["agency_id"],
        "appointment_date": {
            "$gte": time_window_start,
            "$lte": time_window_end
        },
        "status": {"$in": [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]},
        "id": {"$ne": appointment_id}
    })

    if overlapping:
        raise HTTPException(status_code=400, detail="Time slot already taken")

    await appointments_collection.update_one(
        {"id": appointment_id},
        {"$set": {"appointment_date": new_time}}
    )

    updated = await appointments_collection.find_one(
        {"id": appointment_id},
        {"_id": 0}
    )

    return Appointment(**updated)


@router.patch("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await appointments_collection.update_one(
        {"id": appointment_id},
        {
            "$set": {
                "status": AppointmentStatus.CANCELLED,
                "deleted_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment cancelled"}

#boton eliminado de frontend
@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user = Depends(get_current_user)
):
    result = await appointments_collection.update_one(
        {"id": appointment_id},
        {
            "$set": {
                "status": AppointmentStatus.CANCELLED,
                "deleted_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment cancelled and hidden"}




@router.delete("/{appointment_id}/permanent")
async def delete_appointment_permanently(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await appointments_collection.delete_one(
        {"id": appointment_id}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment permanently deleted"}

@router.delete("/cleanup/old")
async def cleanup_old_appointments(
    current_user=Depends(get_current_user)
):
    result = await cleanup_old_cancelled_appointments(days=90)
    return result
