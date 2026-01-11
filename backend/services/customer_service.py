# services/customer_service.py

import uuid
from datetime import datetime
from database import customers_collection
from models import LeadSource


async def get_or_create_customer(
    *,
    agency_id: str,
    phone: str,
    source: LeadSource,
    name: str | None = None,
    email: str | None = None,
) -> dict:
    """
    ÚNICA forma válida de crear / obtener clientes en todo el sistema
    """

    customer = await customers_collection.find_one({
        "agency_id": agency_id,
        "phone": phone
    })

    if customer:
        return customer

    customer = {
        "id": str(uuid.uuid4()),
        "agency_id": agency_id,
        "name": name or "Cliente WhatsApp",
        "phone": phone,
        "email": email,
        "source": source.value,
        "created_at": datetime.utcnow()
    }

    await customers_collection.insert_one(customer)
    return customer
