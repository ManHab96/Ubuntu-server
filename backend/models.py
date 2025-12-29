from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class LeadSource(str, Enum):
    ORGANIC = "organic"
    META_ADS = "meta_ads"
    WHATSAPP_LINK = "whatsapp_link"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: UserRole = UserRole.ADMIN
    agency_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.ADMIN

class UserLogin(BaseModel):
    email: str
    password: str

class Agency(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    address: str
    phone: str
    google_maps_url: Optional[str] = None
    business_hours: str
    whatsapp_phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AgencyCreate(BaseModel):
    name: str
    address: str
    phone: str
    google_maps_url: Optional[str] = None
    business_hours: str
    whatsapp_phone: Optional[str] = None

class Car(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    brand: str
    model: str
    year: int
    price: Optional[float] = None
    description: Optional[str] = None
    is_available: bool = True
    images: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CarCreate(BaseModel):
    agency_id: str
    brand: str
    model: str
    year: int
    price: Optional[float] = None
    description: Optional[str] = None
    is_available: bool = True

class MediaFile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    filename: str
    file_path: str
    file_type: str  # image or pdf
    category: str  # car, agency, promotion
    related_id: Optional[str] = None  # car_id or promotion_id
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class Promotion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    file_id: Optional[str] = None
    car_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PromotionCreate(BaseModel):
    agency_id: str
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    car_ids: List[str] = []

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    name: str
    phone: str
    email: Optional[str] = None
    source: LeadSource = LeadSource.ORGANIC
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    agency_id: str
    name: str
    phone: str
    email: Optional[str] = None
    source: LeadSource = LeadSource.ORGANIC

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    customer_id: str
    car_id: Optional[str] = None
    appointment_date: datetime
    status: AppointmentStatus = AppointmentStatus.PENDING
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    agency_id: str
    customer_id: str
    car_id: Optional[str] = None
    appointment_date: datetime
    notes: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    conversation_id: str
    from_customer: bool
    message_text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    customer_id: str
    whatsapp_phone: str
    last_message: Optional[str] = None
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SystemConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    agency_id: str
    whatsapp_access_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_business_account_id: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_system_prompt: Optional[str] = None
    primary_color: str = "hsl(221.2 83.2% 53.3%)"
    secondary_color: str = "hsl(210 40% 96.1%)"
    button_color: str = "hsl(221.2 83.2% 53.3%)"
    text_color: str = "hsl(0 0% 3.9%)"
    brand_name: str = "Agencia Automotriz"
    brand_description: str = "Tu mejor opción en autos"
    promotional_link_message: str = "Hola, estoy interesado en conocer más sobre sus vehículos."
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemConfigUpdate(BaseModel):
    whatsapp_access_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_business_account_id: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_system_prompt: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    button_color: Optional[str] = None
    text_color: Optional[str] = None
    brand_name: Optional[str] = None
    brand_description: Optional[str] = None
    promotional_link_message: Optional[str] = None

class DashboardMetrics(BaseModel):
    appointments_today: int
    total_leads: int
    meta_ads_leads: int
    top_consulted_cars: List[dict]
