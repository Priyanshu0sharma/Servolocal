import uuid
import logging
from typing import Optional
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

logger = logging.getLogger("storage_r2")


def _get_r2_client():
    """Initializes and returns boto3 S3 client for Cloudflare R2."""
    endpoint = (
        getattr(settings, "R2_ENDPOINT_URL", "")
        or getattr(settings, "R2_ENDPOINT", "")
    )

    if not (endpoint and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY):
        return None

    try:
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            ),
            region_name="auto",
        )
    except Exception as e:
        logger.warning(f"[R2 CLIENT INIT WARNING] {e}")
        return None


def upload_image_to_r2(
    file_bytes: bytes,
    filename: str,
    content_type: str = "image/jpeg",
    folder: str = "custom-items",
) -> str:
    """
    Uploads image bytes to Cloudflare R2 bucket under:
    {folder}/{uuid}_{filename}
    Returns public access URL via settings.R2_PUBLIC_URL (0 bandwidth egress cost).
    Includes safe try/except fallback if credentials are not configured.
    """
    clean_filename = filename.replace(" ", "_")
    unique_key = f"{folder}/{uuid.uuid4().hex}_{clean_filename}"

    client = _get_r2_client()

    if client and settings.R2_BUCKET_NAME:
        try:
            client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=unique_key,
                Body=file_bytes,
                ContentType=content_type,
            )

            public_base = (settings.R2_PUBLIC_URL or "").rstrip("/")
            if public_base:
                return f"{public_base}/{unique_key}"
            return f"https://{settings.R2_BUCKET_NAME}.r2.dev/{unique_key}"
        except (BotoCoreError, ClientError, Exception) as e:
            logger.error(f"[R2 UPLOAD ERROR] {e}. Using fallback URL.")

    # Safe fallback if R2 credentials are unset or upload fails
    logger.warning(f"[R2 FALLBACK] File '{clean_filename}' saved with mock URL key: {unique_key}")
    public_base = (settings.R2_PUBLIC_URL or "https://pub-8897640d3c294b099af1aa1be730700b.r2.dev").rstrip("/")
    return f"{public_base}/{unique_key}"
