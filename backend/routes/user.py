from fastapi import APIRouter
from models.schemas import UserProfile
from services.engine import db

router = APIRouter(prefix="/user", tags=["User"])

@router.get("", response_model=UserProfile)
def get_user():
    return db.profile

@router.post("")
def save_user(profile: UserProfile):
    db.profile = profile
    return {"status": "success", "message": "Profile updated."}
