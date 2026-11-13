import logging
import uuid
from typing import Optional, Dict
import boto3
from botocore.config import Config
from app.core.config import settings

logger = logging.getLogger(__name__)


class CloudflareR2Storage:
    """
    Cloudflare R2 Storage Manager using Boto3 (S3 Compatible API).
    Provides ₹0 bandwidth egress image hosting for shops & products.
    """

    def __init__(self):
        self.endpoint_url = settings.R2_ENDPOINT or (
            f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            if settings.R2_ACCOUNT_ID
            else None
        )
        self.access_key = settings.R2_ACCESS_KEY_ID
        self.secret_key = settings.R2_SECRET_ACCESS_KEY
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = (settings.R2_PUBLIC_URL or "").rstrip("/")

        self.is_configured = bool(
            self.endpoint_url and self.access_key and self.secret_key
        )

        self._client = None

    @property
    def client(self):
        if not self._client and self.is_configured:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )
        return self._client

    def upload_image(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str = "image/jpeg",
        folder: str = "products",
    ) -> Optional[str]:
        """
        Uploads image file bytes directly to Cloudflare R2 bucket.
        Returns the public CDN URL.
        """
        if not self.is_configured or not self.client:
            logger.warning("Cloudflare R2 is not fully configured.")
            return None

        ext = original_filename.split(".")[-1].lower() if "." in original_filename else "jpg"
        unique_key = f"{folder}/{uuid.uuid4().hex}.{ext}"

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=unique_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            return f"{self.public_url}/{unique_key}"
        except Exception as e:
            logger.error(f"Failed to upload to Cloudflare R2: {e}")
            return None

    def generate_presigned_upload_url(
        self,
        filename: str,
        content_type: str = "image/jpeg",
        folder: str = "products",
        expires_in: int = 3600,
    ) -> Optional[Dict[str, str]]:
        """
        Generates a direct presigned PUT URL for client-side uploads.
        """
        if not self.is_configured or not self.client:
            return None

        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        unique_key = f"{folder}/{uuid.uuid4().hex}.{ext}"

        try:
            presigned_url = self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": unique_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            return {
                "upload_url": presigned_url,
                "file_key": unique_key,
                "public_url": f"{self.public_url}/{unique_key}",
            }
        except Exception as e:
            logger.error(f"Failed to generate presigned R2 URL: {e}")
            return None


r2_storage = CloudflareR2Storage()

