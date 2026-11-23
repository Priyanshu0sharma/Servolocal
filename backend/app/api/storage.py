from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from typing import Literal
from app.api.seller import get_current_seller
from pydantic import BaseModel
from app.core.r2 import r2_storage

router = APIRouter(prefix="/storage", tags=["Storage & R2"], dependencies=[Depends(get_current_seller)])


ImageType = Literal["image/jpeg", "image/png", "image/webp"]
ImageFolder = Literal["products", "shops", "banners"]
EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: ImageType = "image/jpeg"
    folder: ImageFolder = "products"


@router.post("/upload")
async def upload_file_to_r2(
    file: UploadFile = File(...),
    folder: ImageFolder = Form("products"),
):
    """
    Upload an image (shop banner, product photo) directly to Cloudflare R2.
    Returns the high-speed public CDN URL.
    """
    if not r2_storage.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Cloudflare R2 storage is not configured. Please check environment variables.",
        )

    content_type = file.content_type
    if content_type not in EXTENSIONS:
        raise HTTPException(415, "Choose a JPEG, PNG or WebP image.")
    limit = 5 * 1024 * 1024
    file_bytes = await file.read(limit + 1)
    if len(file_bytes) > limit:
        raise HTTPException(413, "Image exceeds 5 MiB.")
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    matches = {
        "image/jpeg": file_bytes.startswith(bytes.fromhex("ffd8ff")),
        "image/png": file_bytes.startswith(bytes.fromhex("89504e470d0a1a0a")),
        "image/webp": file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP",
    }
    if not matches[content_type]:
        raise HTTPException(415, "File contents do not match the image type.")
    cdn_url = r2_storage.upload_image(
        file_bytes=file_bytes,
        original_filename=f"image.{EXTENSIONS[content_type]}",
        content_type=content_type,
        folder=folder,
    )

    if not cdn_url:
        raise HTTPException(status_code=500, detail="Failed to upload file to Cloudflare R2.")

    return {
        "success": True,
        "url": cdn_url,
        "filename": file.filename,
        "content_type": content_type,
    }


@router.post("/presigned-url")
async def get_presigned_upload_url(payload: PresignedUrlRequest):
    """
    Generates a presigned PUT URL allowing frontends to upload images directly to Cloudflare R2.
    """
    if not r2_storage.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Cloudflare R2 storage is not configured.",
        )

    presigned_data = r2_storage.generate_presigned_upload_url(
        filename=f"image.{EXTENSIONS[payload.content_type]}",
        content_type=payload.content_type,
        folder=payload.folder,
    )

    if not presigned_data:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL.")

    return {
        "success": True,
        **presigned_data,
    }

