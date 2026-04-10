from fastapi import APIRouter
from typing import List
from models.schemas import MealRecommendation
from services.engine import get_smart_recommendations

router = APIRouter(prefix="/recommend", tags=["Recommend"])

@router.get("", response_model=List[MealRecommendation])
def get_recommendations():
    return get_smart_recommendations()
