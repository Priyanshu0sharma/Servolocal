from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import AppVersionConfig, PromoBanner

router = APIRouter(tags=["App Config"])


@router.get("/app-config")
async def get_app_config(db: AsyncSession = Depends(get_db)):
    """
    Returns application configuration, version requirements, maintenance mode status, and active banners.
    """
    config_res = await db.execute(select(AppVersionConfig).limit(1))
    config = config_res.scalar_one_or_none()

    banners_res = await db.execute(
        select(PromoBanner).where(PromoBanner.is_active == True).order_by(PromoBanner.display_order.asc())
    )
    banners = banners_res.scalars().all()

    return {
        "latest_version": config.latest_version if config else "1.0.0",
        "min_required_version": config.min_required_version if config else "1.0.0",
        "force_update": config.force_update if config else False,
        "update_message": config.update_message if config else "ServoLocal is running latest version.",
        "playstore_url": config.playstore_url if config else "https://play.google.com/store/apps",
        "maintenance_mode": config.maintenance_mode if config else False,
        "maintenance_message": config.maintenance_message if config else None,
        "banners": [
            {
                "id": b.id,
                "title": b.title,
                "image_url": b.image_url,
                "target_route": b.target_route,
                "badge_text": b.badge_text,
            }
            for b in banners
        ],
    }

