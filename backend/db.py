import os
from motor.motor_asyncio import AsyncIOMotorClient

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client


def get_db():
    return get_client()[os.environ["DB_NAME"]]


async def ensure_indexes():
    db = get_db()
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", sparse=True)
    await db.users.create_index("phone", sparse=True)
    await db.patient_profiles.create_index("patient_id", unique=True)
    await db.caregiver_links.create_index([("patient_id", 1), ("caregiver_id", 1)], unique=True)
    await db.invite_codes.create_index("invite_code", unique=True)
    await db.game_sessions.create_index("session_id", unique=True)
    await db.sticky_notes.create_index("note_id", unique=True)
    await db.reminder_logs.create_index("log_id", unique=True)
    await db.location_pings.create_index("ping_id", unique=True)
