"""Storage service for S3-compatible storage using boto3."""

import os
import uuid
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()


class StorageService:
    """Service for handling file storage with S3-compatible APIs using boto3."""

    def __init__(self):
        """Initialize S3 client."""
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.get_s3_endpoint_url(),
            aws_access_key_id=settings.get_aws_access_key_id(),
            aws_secret_access_key=settings.get_aws_secret_access_key(),
            config=Config(signature_version="s3v4"),
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME

    async def _ensure_bucket_exists(self) -> None:
        """Ensure the bucket exists."""
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "404":
                try:
                    self.client.create_bucket(Bucket=self.bucket_name)
                except Exception as create_err:
                    raise Exception(f"Failed to create bucket: {create_err}")
            else:
                raise Exception(f"Failed to verify bucket: {e}")

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: Optional[str] = None,
    ) -> str:
        """Upload a file to S3 storage."""
        await self._ensure_bucket_exists()

        # Generate unique object name
        file_extension = os.path.splitext(filename)[1]
        object_name = f"documents/{uuid.uuid4()}{file_extension}"

        try:
            # Upload file
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_content,
                ContentType=content_type or "application/octet-stream",
            )

            # Return URL
            return f"{settings.get_s3_endpoint_url().rstrip('/')}/{self.bucket_name}/{object_name}"
        except Exception as e:
            raise Exception(f"Failed to upload file: {e}")

    async def download_file(self, storage_url: str) -> bytes:
        """Download a file from S3 storage."""
        # Extract object name from URL
        parts = storage_url.split("/")
        try:
            bucket_idx = parts.index(self.bucket_name)
        except ValueError:
            raise ValueError(f"Bucket name '{self.bucket_name}' not found in URL")

        object_name = "/".join(parts[bucket_idx + 1:])

        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=object_name)
            return response["Body"].read()
        except Exception as e:
            raise Exception(f"Failed to download file: {e}")

    async def delete_file(self, storage_url: str) -> None:
        """Delete a file from S3 storage."""
        # Extract object name from URL
        parts = storage_url.split("/")
        try:
            bucket_idx = parts.index(self.bucket_name)
        except ValueError:
            raise ValueError(f"Bucket name '{self.bucket_name}' not found in URL")

        object_name = "/".join(parts[bucket_idx + 1:])

        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=object_name)
        except Exception as e:
            raise Exception(f"Failed to delete file: {e}")

    async def get_file_metadata(self, storage_url: str) -> dict:
        """Get file metadata from S3 storage."""
        # Extract object name from URL
        parts = storage_url.split("/")
        try:
            bucket_idx = parts.index(self.bucket_name)
        except ValueError:
            raise ValueError(f"Bucket name '{self.bucket_name}' not found in URL")

        object_name = "/".join(parts[bucket_idx + 1:])

        try:
            response = self.client.head_object(Bucket=self.bucket_name, Key=object_name)
            return {
                "content_type": response.get("ContentType"),
                "size": response.get("ContentLength"),
                "last_modified": response.get("LastModified").isoformat() if response.get("LastModified") else None,
                "etag": response.get("ETag"),
            }
        except Exception as e:
            raise Exception(f"Failed to get file metadata: {e}")