from fastapi import APIRouter

from schemas.item import Item

router = APIRouter(prefix="/items", tags=["items"])


@router.get("")
async def list_items() -> list[Item]:
    return []
