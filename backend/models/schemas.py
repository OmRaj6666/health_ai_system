from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserProfile(BaseModel):
    age: Optional[int] = None
    weight: Optional[int] = None
    goal: str = "maintain" # lose, gain, maintain, energy
    diet: str = "none" # none, vegetarian, vegan, keto

class ActivityLog(BaseModel):
    activity_type: str
    details: str
    timestamp: Optional[datetime] = None

class MealRecommendation(BaseModel):
    id: int
    name: str
    calories: int
    protein_g: int
    carbs_g: int
    fats_g: int
    sugar_g: int
    reason: str

class Nudge(BaseModel):
    message: str
    urgency: str
    type: str

class Insight(BaseModel):
    type: str # warning, praise, neutral
    title: str
    desc: str
    severity: str # bad, good, neutral

class HealthScoreResponse(BaseModel):
    score: int
    trend: str
