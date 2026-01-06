from fastapi import APIRouter, HTTPException, Depends
from models import SystemConfig, SystemConfigUpdate
from database import system_config_collection
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/{agency_id}", response_model=SystemConfig)
async def get_config(
    agency_id: str,
    current_user: dict = Depends(get_current_user)
):
    config = await system_config_collection.find_one(
        {"agency_id": agency_id},
        {"_id": 0}
    )

    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")

    return SystemConfig(**config)


@router.put("/{agency_id}", response_model=SystemConfig)
async def update_config(
    agency_id: str,
    config_update: SystemConfigUpdate,
    current_user: dict = Depends(get_current_user)
):
    existing = await system_config_collection.find_one(
        {"agency_id": agency_id}
    )

    if not existing:
        base_config = {
            "agency_id": agency_id,
            "ai_system_prompt": config_update.ai_system_prompt,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        await system_config_collection.insert_one(base_config)
        return SystemConfig(**base_config)

    update_dict = {
        k: v for k, v in config_update.model_dump().items()
        if v is not None
    }
    update_dict["updated_at"] = datetime.utcnow()

    await system_config_collection.update_one(
        {"agency_id": agency_id},
        {"$set": update_dict}
    )

    updated = await system_config_collection.find_one(
        {"agency_id": agency_id},
        {"_id": 0}
    )

    return SystemConfig(**updated)
