from fastapi import APIRouter, HTTPException, Depends
from models import UserCreate, UserLogin, User
from database import users_collection
from auth import hash_password, verify_password, create_access_token, get_current_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user.password)
    
    user_dict = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "hashed_password": hashed_password,
        "created_at": user.created_at if hasattr(user, 'created_at') else None
    }
    
    await users_collection.insert_one(user_dict)
    
    token = create_access_token({"sub": user_id, "email": user.email, "role": user.role})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"id": current_user["id"]}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
