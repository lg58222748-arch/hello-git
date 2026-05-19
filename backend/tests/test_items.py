import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_list_items_returns_empty_array_initially(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/items")
    assert response.status_code == 200
    assert response.json() == []
