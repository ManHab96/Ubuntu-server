from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from database import media_files_collection
from auth import get_current_user
from models import MediaFile, PromotionUpdate

router = APIRouter(prefix="/api/promotions", tags=["promotions"])

@router.get("/", response_model=List[MediaFile])
async def get_promotions(
    agency_id: str,
    current_user: dict = Depends(get_current_user)
):
    promotions = []

    cursor = media_files_collection.find({
        "agency_id": agency_id,
        "category": "promotion"
    })

    async for doc in cursor:
        promotions.append(MediaFile(**doc))

    return promotions



@router.get("/{file_id}", response_model=MediaFile)
async def get_promotion(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    promo = await media_files_collection.find_one(
        {
            "id": file_id,
            "category": "promotion"
        },
        {"_id": 0}
    )

    if not promo:
        raise HTTPException(404, "Promotion not found")

    return promo
@router.patch("/{file_id}", response_model=MediaFile)

async def update_promotion(
    file_id: str,
    data: PromotionUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in data.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await media_files_collection.find_one_and_update(
        {
            "id": file_id,
            "category": "promotion"
        },
        {
            "$set": update_data
        },
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Promotion not found")

    return MediaFile(**result)



@router.patch("/{file_id}/toggle")
async def toggle_promotion(
    file_id: str,
    is_active: bool,
    current_user: dict = Depends(get_current_user)
):
    promotion = await media_files_collection.find_one({
        "id": file_id,
        "category": "promotion"
    })

    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")

    # 🔒 VALIDACIÓN SOLO AL ACTIVAR
    if is_active:
        start_date = promotion.get("start_date")
        end_date = promotion.get("end_date")

        if not start_date or not end_date:
            raise HTTPException(
                status_code=400,
                detail="Promotion must have start_date and end_date before activation"
            )

        now = datetime.now(timezone.utc)

        if start_date > now:
            raise HTTPException(
                status_code=400,
                detail="Promotion has not started yet"
            )

        if end_date < now:
            raise HTTPException(
                status_code=400,
                detail="Promotion is expired"
            )

    await media_files_collection.update_one(
        {"id": file_id},
        {"$set": {"is_active": is_active}}
    )

    return {
        "message": "Promotion status updated",
        "is_active": is_active
    }
