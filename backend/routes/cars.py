from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from models import Car, CarCreate
from database import cars_collection
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/cars", tags=["cars"])

@router.post("/", response_model=Car)
async def create_car(car: CarCreate, current_user: dict = Depends(get_current_user)):
    car_id = str(uuid.uuid4())
    
    car_dict = {
        "id": car_id,
        **car.model_dump(),
        "images": [],
        "created_at": datetime.utcnow()
    }
    
    await cars_collection.insert_one(car_dict)
    return Car(**car_dict)

@router.get("/", response_model=List[Car])
async def get_cars(
    agency_id: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if brand:
        query["brand"] = brand
    if is_available is not None:
        query["is_available"] = is_available
    
    cars = await cars_collection.find(query, {"_id": 0}).to_list(1000)
    return [Car(**car) for car in cars]

@router.get("/{car_id}", response_model=Car)
async def get_car(car_id: str, current_user: dict = Depends(get_current_user)):
    car = await cars_collection.find_one({"id": car_id}, {"_id": 0})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return Car(**car)

@router.put("/{car_id}", response_model=Car)
async def update_car(car_id: str, car_update: CarCreate, current_user: dict = Depends(get_current_user)):
    existing = await cars_collection.find_one({"id": car_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Car not found")
    
    update_dict = car_update.model_dump()
    await cars_collection.update_one({"id": car_id}, {"$set": update_dict})
    
    updated = await cars_collection.find_one({"id": car_id}, {"_id": 0})
    return Car(**updated)

@router.delete("/{car_id}")
async def delete_car(car_id: str, current_user: dict = Depends(get_current_user)):
    result = await cars_collection.delete_one({"id": car_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Car deleted successfully"}

@router.patch("/{car_id}/availability")
async def toggle_availability(car_id: str, is_available: bool, current_user: dict = Depends(get_current_user)):
    result = await cars_collection.update_one({"id": car_id}, {"$set": {"is_available": is_available}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Availability updated"}
