from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Rob.AVA 50-line Prototype")
DB: dict[str, dict[str, Any]] = {}


class Rules(BaseModel):
    allowed_partners: list[str] = Field(default_factory=list)
    restricted_topics: list[str] = Field(default_factory=list)
    max_interaction_duration: int = 300


class Persona(BaseModel):
    persona_id: str
    owner_id: str
    display_name: str
    languages: list[str]
    consent_level: Literal["private", "crew-only", "public"] = "crew-only"
    collaboration_rules: Rules
    status: Literal["candidate", "approved", "rejected"] = "candidate"
    review_log: list[dict[str, Any]] = Field(default_factory=list)


@app.post("/ava/create")
def create_ava(profile: Persona) -> dict[str, Any]:
    if profile.persona_id in DB:
        raise HTTPException(status_code=409, detail="persona exists")
    DB[profile.persona_id] = profile.model_dump()
    return {"message": "created", "persona_id": profile.persona_id}


@app.post("/ava/review/{persona_id}")
def review_ava(persona_id: str, approve: bool = True, reason: str = "") -> dict[str, Any]:
    if persona_id not in DB:
        raise HTTPException(status_code=404, detail="persona not found")
    DB[persona_id]["review_log"].append(
        {"timestamp_utc": datetime.now(timezone.utc).isoformat(), "approved": approve, "reason": reason}
    )
    DB[persona_id]["status"] = "approved" if approve else "rejected"
    return {"message": DB[persona_id]["status"]}


@app.get("/ava/list")
def list_avas() -> dict[str, Any]:
    return {"avas": list(DB.values())}


@app.get("/ava/can_collab/{persona_id}/{partner_id}")
def can_collab(persona_id: str, partner_id: str) -> dict[str, Any]:
    if persona_id not in DB:
        raise HTTPException(status_code=404, detail="persona not found")
    allowed = partner_id in DB[persona_id]["collaboration_rules"]["allowed_partners"]
    return {"can_collaborate": allowed}

