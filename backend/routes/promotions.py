from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Promotion, PromotionCreate
from database import promotions_collection
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/promotions", tags=["promotions"])

@router.post("/", response_model=Promotion)
async def create_promotion(promotion: PromotionCreate, current_user: dict = Depends(get_current_user)):
    promotion_id = str(uuid.uuid4())
    
    promotion_dict = {
        "id": promotion_id,
        **promotion.model_dump(),
        "is_active": True,
        "file_id": None,
        "created_at": datetime.utcnow()
    }
    
    await promotions_collection.insert_one(promotion_dict)
    return Promotion(**promotion_dict)

@router.get("/", response_model=List[Promotion])
async def get_promotions(agency_id: str = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    
    promotions = await promotions_collection.find(query, {"_id": 0}).to_list(1000)
    return [Promotion(**promo) for promo in promotions]

@router.get("/active", response_model=List[Promotion])
async def get_active_promotions(agency_id: str, current_user: dict = Depends(get_current_user)):
    now = datetime.utcnow()
    promotions = await promotions_collection.find({
        "agency_id": agency_id,
        "is_active": True,
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }, {"_id": 0}).to_list(1000)
    return [Promotion(**promo) for promo in promotions]

@router.get("/{promotion_id}", response_model=Promotion)
async def get_promotion(promotion_id: str, current_user: dict = Depends(get_current_user)):
    promotion = await promotions_collection.find_one({"id": promotion_id}, {"_id": 0})
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return Promotion(**promotion)

@router.put("/{promotion_id}", response_model=Promotion)
async def update_promotion(promotion_id: str, promotion_update: PromotionCreate, current_user: dict = Depends(get_current_user)):
    existing = await promotions_collection.find_one({"id": promotion_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    update_dict = promotion_update.model_dump()
    await promotions_collection.update_one({"id": promotion_id}, {"$set": update_dict})
    
    updated = await promotions_collection.find_one({"id": promotion_id}, {"_id": 0})
    return Promotion(**updated)

@router.patch("/{promotion_id}/toggle")
async def toggle_promotion(promotion_id: str, is_active: bool, current_user: dict = Depends(get_current_user)):
    result = await promotions_collection.update_one({"id": promotion_id}, {"$set": {"is_active": is_active}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return {"message": "Promotion status updated"}

@router.delete("/{promotion_id}")
async def delete_promotion(promotion_id: str, current_user: dict = Depends(get_current_user)):
    result = await promotions_collection.delete_one({"id": promotion_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return {"message": "Promotion deleted successfully"}
