from fastapi import APIRouter, HTTPException, Depends
from database import (
    appointments_collection, customers_collection, cars_collection, 
    messages_collection, conversations_collection
)
from auth import get_current_user
from datetime import datetime, timedelta
from collections import Counter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics/{agency_id}")
async def get_dashboard_metrics(agency_id: str, current_user: dict = Depends(get_current_user)):
    # Appointments today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    appointments_today = await appointments_collection.count_documents({
        "agency_id": agency_id,
        "appointment_date": {
            "$gte": today_start,
            "$lt": today_end
        }
    })
    
    # Total leads
    total_leads = await customers_collection.count_documents({"agency_id": agency_id})
    
    # Meta ads leads
    meta_ads_leads = await customers_collection.count_documents({
        "agency_id": agency_id,
        "source": "meta_ads"
    })
    
    # Total conversations
    total_conversations = await conversations_collection.count_documents({"agency_id": agency_id})
    
    # Leads by source
    customers = await customers_collection.find({"agency_id": agency_id}, {"_id": 0, "source": 1}).to_list(1000)
    leads_by_source = Counter([c.get("source", "organic") for c in customers])
    
    # Appointments by status
    all_appointments = await appointments_collection.find({"agency_id": agency_id}, {"_id": 0, "status": 1}).to_list(1000)
    appointments_by_status = Counter([a.get("status", "pending") for a in all_appointments])
    
    # Top consulted cars (based on cars in the inventory)
    cars = await cars_collection.find({"agency_id": agency_id}, {"_id": 0}).to_list(100)
    
    top_consulted_cars = [
        {
            "brand": car.get("brand", ""),
            "model": car.get("model", ""),
            "year": car.get("year", ""),
            "consultations": car.get("consultations", 1)
        }
        for car in cars[:5]
    ]
    
    return {
        "appointments_today": appointments_today,
        "total_leads": total_leads,
        "meta_ads_leads": meta_ads_leads,
        "total_conversations": total_conversations,
        "top_consulted_cars": top_consulted_cars,
        "leads_by_source": dict(leads_by_source),
        "appointments_by_status": dict(appointments_by_status)
    }
