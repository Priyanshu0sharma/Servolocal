from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from pydantic import BaseModel
from app.core.r2 import r2_storage

router = APIRouter(prefix="/storage", tags=["Storage & R2"])


class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str = "image/jpeg"
    folder: str = "products"


@router.post("/upload")
async def upload_file_to_r2(
    file: UploadFile = File(...),
    folder: str = Form("products"),
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

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    content_type = file.content_type or "image/jpeg"
    cdn_url = r2_storage.upload_image(
        file_bytes=file_bytes,
        original_filename=file.filename or "image.jpg",
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
        filename=payload.filename,
        content_type=payload.content_type,
        folder=payload.folder,
    )

    if not presigned_data:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL.")

    return {
        "success": True,
        **presigned_data,
    }

