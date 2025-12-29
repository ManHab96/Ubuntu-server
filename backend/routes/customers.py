from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import Customer, CustomerCreate
from database import customers_collection
from auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.post("/", response_model=Customer)
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    # Check if customer already exists by phone
    existing = await customers_collection.find_one({"phone": customer.phone, "agency_id": customer.agency_id})
    if existing:
        return Customer(**existing)
    
    customer_id = str(uuid.uuid4())
    
    customer_dict = {
        "id": customer_id,
        **customer.model_dump(),
        "created_at": datetime.utcnow()
    }
    
    await customers_collection.insert_one(customer_dict)
    return Customer(**customer_dict)

@router.get("/", response_model=List[Customer])
async def get_customers(agency_id: str = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    
    customers = await customers_collection.find(query, {"_id": 0}).to_list(1000)
    return [Customer(**customer) for customer in customers]

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await customers_collection.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@router.get("/phone/{phone}")
async def get_customer_by_phone(phone: str, agency_id: str, current_user: dict = Depends(get_current_user)):
    customer = await customers_collection.find_one({"phone": phone, "agency_id": agency_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)
