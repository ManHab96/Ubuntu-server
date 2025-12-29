from fastapi import APIRouter, HTTPException, Depends
from models import UserCreate, UserLogin, User
from database import users_collection
from auth import hash_password, verify_password, create_access_token, get_current_user, create_reset_token, verify_reset_token
import uuid
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    name: str
    email: str

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

@router.put("/profile")
async def update_profile(profile_data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    # Check if email is already taken by another user
    existing = await users_collection.find_one({"email": profile_data.email, "id": {"$ne": current_user["id"]}})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    await users_collection.update_one(
        {"id": current_user["id"]},
        {"$set": {"name": profile_data.name, "email": profile_data.email}}
    )
    
    updated_user = await users_collection.find_one({"id": current_user["id"]}, {"_id": 0, "hashed_password": 0})
    return updated_user

@router.post("/change-password")
async def change_password(password_data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"id": current_user["id"]})
    
    if not verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hashed_password = hash_password(password_data.new_password)
    
    await users_collection.update_one(
        {"id": current_user["id"]},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

@router.post("/reset-password-request")
async def reset_password_request(request: ResetPasswordRequest):
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset link will be sent"}
    
    reset_token = create_reset_token(request.email)
    
    # In production, send email with reset link
    # For now, we'll log it to console
    reset_url = f"/reset-password?token={reset_token}"
    print(f"🔐 Password reset requested for {request.email}")
    print(f"Reset URL: {reset_url}")
    print(f"Token: {reset_token}")
    
    return {
        "message": "If the email exists, a reset link will be sent",
        "reset_url": reset_url,  # Remove this in production
        "token": reset_token  # Remove this in production
    }

@router.post("/reset-password")
async def reset_password(reset_data: ResetPasswordConfirm):
    email = verify_reset_token(reset_data.token)
    
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_hashed_password = hash_password(reset_data.new_password)
    
    await users_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password reset successfully"}
