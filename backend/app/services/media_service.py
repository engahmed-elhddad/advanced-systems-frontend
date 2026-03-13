"""Media service — handles file uploads for product images and datasheets."""
import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException
import aiofiles

from app.core.config import settings


class MediaService:
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    ALLOWED_DATASHEET_TYPES = {"application/pdf"}
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_DATASHEET_SIZE = 50 * 1024 * 1024  # 50 MB

    def _products_dir(self) -> Path:
        d = Path(settings.UPLOADS_DIR) / "products"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _datasheets_dir(self) -> Path:
        d = Path(settings.UPLOADS_DIR) / "datasheets"
        d.mkdir(parents=True, exist_ok=True)
        return d

    async def save_product_image(self, part_number: str, file: UploadFile) -> str:
        """Save an uploaded product image. Returns the URL path."""
        if file.content_type not in self.ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type. Use JPEG, PNG, or WebP.")

        content = await file.read()
        if len(content) > self.MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image too large (max 10 MB).")

        ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
        safe_part = part_number.replace(" ", "_").upper()
        filename = f"{safe_part}_{uuid.uuid4().hex[:8]}.{ext}"
        dest = self._products_dir() / filename

        async with aiofiles.open(dest, "wb") as f:
            await f.write(content)

        return f"/uploads/products/{filename}"

    async def save_datasheet(self, part_number: str, file: UploadFile) -> tuple[str, str]:
        """Save an uploaded datasheet PDF. Returns (filename, url_path)."""
        if file.content_type not in self.ALLOWED_DATASHEET_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF datasheets are accepted.")

        content = await file.read()
        if len(content) > self.MAX_DATASHEET_SIZE:
            raise HTTPException(status_code=400, detail="Datasheet too large (max 50 MB).")

        safe_part = part_number.replace(" ", "_").upper()
        original_name = file.filename or f"{safe_part}.pdf"
        filename = f"{safe_part}_{uuid.uuid4().hex[:8]}_{original_name}"
        dest = self._datasheets_dir() / filename

        async with aiofiles.open(dest, "wb") as f:
            await f.write(content)

        return original_name, f"/uploads/datasheets/{filename}"

    def delete_file(self, url_path: str) -> bool:
        """Delete a file by its URL path (e.g. /uploads/products/...)."""
        relative = url_path.lstrip("/")
        full_path = Path(settings.UPLOADS_DIR).parent / relative
        if full_path.exists():
            full_path.unlink()
            return True
        return False
