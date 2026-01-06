from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Agency, AgencyCreate
from database import agencies_collection, system_config_collection
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/agencies", tags=["agencies"])

@router.post("/", response_model=Agency)
async def create_agency(agency: AgencyCreate, current_user: dict = Depends(get_current_user)):
    agency_id = str(uuid.uuid4())
    
    agency_dict = {
        "id": agency_id,
        **agency.model_dump(),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await agencies_collection.insert_one(agency_dict)
    
    # Create default system config for the agency
    config_dict = {
        "id": str(uuid.uuid4()),
        "agency_id": agency_id,
        "ai_system_prompt": """Eres un asistente virtual profesional de una agencia automotriz en México.

Tu objetivo principal es: AGENDAR CITAS para que los clientes conozcan los vehículos.

Reglas importantes:
1. Habla en español mexicano de forma profesional, clara y amable
2. Solicita un dato a la vez (nombre, teléfono, fecha preferida)
3. Solo ofrece información de autos disponibles en el inventario
4. Comparte promociones vigentes cuando el cliente pregunte por ofertas
5. NO inventes información, solo usa datos reales del sistema
6. Respeta los horarios de atención de la agencia
7. Confirma siempre los datos antes de agendar

Cuando el cliente pida información de un auto o promoción, compártela de forma clara.
Cuando hayas recopilado: nombre, teléfono y fecha/hora preferida, agenda la cita.
¡Sé útil y orientándolos siempre hacia agendar una cita!""",
        "primary_color": "hsl(221.2 83.2% 53.3%)",
        "secondary_color": "hsl(210 40% 96.1%)",
        "button_color": "hsl(221.2 83.2% 53.3%)",
        "text_color": "hsl(0 0% 3.9%)",
        "brand_name": agency.name,
        "brand_description": "Tu mejor opción en autos",
        "promotional_link_message": "Hola, estoy interesado en conocer más sobre sus vehículos.",
        "updated_at": datetime.utcnow()
    }
    await system_config_collection.insert_one(config_dict)
    
    return Agency(**agency_dict)

@router.get("/", response_model=List[Agency])
async def get_agencies(current_user: dict = Depends(get_current_user)):
    agencies = await agencies_collection.find({}, {"_id": 0}).to_list(1000)
    return [Agency(**agency) for agency in agencies]

@router.get("/{agency_id}", response_model=Agency)
async def get_agency(agency_id: str, current_user: dict = Depends(get_current_user)):
    agency = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return Agency(**agency)

@router.put("/{agency_id}", response_model=Agency)
async def update_agency(agency_id: str, agency_update: AgencyCreate, current_user: dict = Depends(get_current_user)):
    existing = await agencies_collection.find_one({"id": agency_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    update_dict = agency_update.model_dump()
    await agencies_collection.update_one({"id": agency_id}, {"$set": update_dict})
    
    updated = await agencies_collection.find_one({"id": agency_id}, {"_id": 0})
    return Agency(**updated)

@router.delete("/{agency_id}")
async def delete_agency(agency_id: str, current_user: dict = Depends(get_current_user)):
    result = await agencies_collection.delete_one({"id": agency_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agency not found")

    return {"message": "Agency deleted successfully"}


