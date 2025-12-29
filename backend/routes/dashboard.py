from fastapi import APIRouter, HTTPException, Depends
from models import DashboardMetrics
from database import (
    appointments_collection, customers_collection, cars_collection, messages_collection
)
from auth import get_current_user
from datetime import datetime, timedelta
from collections import Counter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics/{agency_id}", response_model=DashboardMetrics)
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
    
    # Top consulted cars (based on conversations mentioning car models)
    # This is a simplified version - in production you'd track this more accurately
    cars = await cars_collection.find({"agency_id": agency_id}, {"_id": 0}).to_list(100)
    
    top_consulted_cars = [
        {
            "brand": car["brand"],
            "model": car["model"],
            "year": car["year"],
            "consultations": 0  # Placeholder
        }
        for car in cars[:5]
    ]
    
    return DashboardMetrics(
        appointments_today=appointments_today,
        total_leads=total_leads,
        meta_ads_leads=meta_ads_leads,
        top_consulted_cars=top_consulted_cars
    )
