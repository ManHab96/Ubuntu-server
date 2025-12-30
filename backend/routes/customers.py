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
async def get_customers(agency_id: str = None, customer_id: str = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if customer_id:
        query["id"] = customer_id
    
    customers = await customers_collection.find(query, {"_id": 0}).to_list(1000)
    return [Customer(**customer) for customer in customers]

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await customers_collection.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerCreate, current_user: dict = Depends(get_current_user)):
    existing = await customers_collection.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_dict = customer_update.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    await customers_collection.update_one({"id": customer_id}, {"$set": update_dict})
    
    updated = await customers_collection.find_one({"id": customer_id}, {"_id": 0})
    return Customer(**updated)

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    result = await customers_collection.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

@router.get("/phone/{phone}")
async def get_customer_by_phone(phone: str, agency_id: str, current_user: dict = Depends(get_current_user)):
    customer = await customers_collection.find_one({"phone": phone, "agency_id": agency_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)
