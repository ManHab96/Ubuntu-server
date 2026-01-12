from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
from PIL import Image
import io
from models import MediaFile
from database import media_files_collection, cars_collection, promotions_collection
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/files", tags=["files"])

# Create uploads directory using relative path (not hardcoded /app/)
BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# File validation
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
ALLOWED_PDF_TYPES = ["application/pdf"]
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_PDF_TYPES

# Image optimization settings
MAX_IMAGE_WIDTH = 1920
MAX_IMAGE_HEIGHT = 1920
JPEG_QUALITY = 85
WEBP_QUALITY = 85

def optimize_image(image_bytes: bytes, filename: str) -> tuple[bytes, str]:
    """Optimize image: resize if needed and compress"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        if img.width > MAX_IMAGE_WIDTH or img.height > MAX_IMAGE_HEIGHT:
            img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='WEBP', quality=WEBP_QUALITY, method=6)
        return output.getvalue(), '.webp'
    except Exception as e:
        print(f"Error optimizing image: {e}")
        return image_bytes, Path(filename).suffix.lower()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    agency_id: str = Form(...),
    category: str = Form(...),
    related_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no soportado. Tipos permitidos: {', '.join(ALLOWED_TYPES)}")

    contents = await file.read()
    original_size = len(contents)

    if original_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande. Máximo: 5MB")

    if file.content_type in ALLOWED_IMAGE_TYPES:
        contents, file_ext = optimize_image(contents, file.filename)
        final_size = len(contents)
        print(f"Image optimized: {original_size} -> {final_size} bytes")
    else:
        file_ext = Path(file.filename).suffix.lower()
        final_size = original_size

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename

    with file_path.open("wb") as buffer:
        buffer.write(contents)

    file_type = "pdf" if file.content_type == "application/pdf" else "image"

    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "agency_id": agency_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_url": f"/api/files/serve/{unique_filename}",
        "file_type": file_type,
        "file_size": final_size,
        "original_size": original_size,
        "category": category,
        "related_id": related_id,
        "uploaded_at": datetime.utcnow()
    }

    await media_files_collection.insert_one(file_dict)

    if category == "car" and related_id:
        await cars_collection.update_one(
            {"id": related_id},
            {"$push": {"images": file_dict["file_url"]}}
        )

    if category == "promotion":
        file_dict.update({
            "title": None,
            "description": None,
            "start_date": None,
            "end_date": None,
            "is_active": False,
        })

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
        except HTTPException:
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
    file_path = Path(file["file_path"])
    if file_path.exists():
        file_path.unlink()
    if file.get("category") == "car" and file.get("related_id"):
        await cars_collection.update_one(
            {"id": file["related_id"]},
            {"$pull": {"images": file.get("file_url")}}
        )
    if file.get("category") == "promotion" and file.get("related_id"):
        await promotions_collection.update_one(
            {"id": file["related_id"]},
            {"$set": {"file_id": None}}
        )
    await media_files_collection.delete_one({"id": file_id})
    return {"message": "File deleted successfully"}
