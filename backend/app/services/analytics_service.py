from __future__ import annotations

from app.mock import generator as gen
from app.mock.pools import DEPARTMENTS
from app.providers.factory import get_powerbi_provider


def analytics_payload() -> dict:
    provider = get_powerbi_provider()
    embed = provider.get_embed_config("organization-overview")
    return {
        "embed": embed,
        "department_comparison": [gen.department_aggregate(d) for d in DEPARTMENTS],
        "org_aggregate": gen.org_aggregate,
    }
