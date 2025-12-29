from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
from models import MediaFile
from database import media_files_collection, cars_collection, promotions_collection
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/files", tags=["files"])

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# File validation
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
ALLOWED_PDF_TYPES = ["application/pdf"]
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_PDF_TYPES

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no soportado. Tipos permitidos: {', '.join(ALLOWED_TYPES)}")
    
    # Read file content to check size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande. Máximo: 5MB")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with file_path.open("wb") as buffer:
        buffer.write(contents)
    
    # Determine file type
    file_type = "pdf" if file.content_type == "application/pdf" else "image"
    
    # Create database record
    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "agency_id": agency_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_url": f"/api/files/serve/{unique_filename}",
        "file_type": file_type,
        "file_size": file_size,
        "category": category,
        "related_id": related_id,
        "uploaded_at": datetime.utcnow()
    }
    
    await media_files_collection.insert_one(file_dict)
    
    # If associated with a car, add to car's images
    if category == "car" and related_id:
        await cars_collection.update_one(
            {"id": related_id},
            {"$push": {"images": file_dict["file_url"]}}
        )
    
    # If associated with a promotion, update promotion
    if category == "promotion" and related_id:
        await promotions_collection.update_one(
            {"id": related_id},
            {"$set": {"file_id": file_id}}
        )
    
    return MediaFile(**file_dict)

@router.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    uploaded_files = []
    
    for file in files:
        try:
            result = await upload_file(file, agency_id, category, related_id, current_user)
            uploaded_files.append(result)
        except HTTPException as e:
            # Continue with other files even if one fails
            continue
    
    return {"uploaded": len(uploaded_files), "files": uploaded_files}

@router.get("/")
async def get_files(
    agency_id: Optional[str] = None,
    category: Optional[str] = None,
    related_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if agency_id:
        query["agency_id"] = agency_id
    if category:
        query["category"] = category
    if related_id:
        query["related_id"] = related_id
    
    files = await media_files_collection.find(query, {"_id": 0}).to_list(1000)
    return [MediaFile(**file) for file in files]

@router.get("/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await media_files_collection.find_one({"id": file_id}, {"_id": 0})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return MediaFile(**file)

@router.delete("/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await media_files_collection.find_one({"id": file_id})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    file_path = Path(file["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Remove from car if associated
    if file.get("category") == "car" and file.get("related_id"):
        await cars_collection.update_one(
            {"id": file["related_id"]},
            {"$pull": {"images": file.get("file_url")}}
        )
    
    # Remove from promotion if associated
    if file.get("category") == "promotion" and file.get("related_id"):
        await promotions_collection.update_one(
            {"id": file["related_id"]},
            {"$set": {"file_id": None}}
        )
    
    # Delete database record
    await media_files_collection.delete_one({"id": file_id})
    
    return {"message": "File deleted successfully"}
