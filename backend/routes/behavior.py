from fastapi import APIRouter
from typing import List
from datetime import datetime
from models.schemas import ActivityLog, Insight, Nudge, HealthScoreResponse
from services.engine import db, analyze_behavior, process_new_log

router = APIRouter(tags=["Behavior"])

@router.get("/behavior", response_model=List[Insight])
def get_insights():
    return analyze_behavior()

@router.post("/track")
def track(log: ActivityLog):
    log.timestamp = datetime.now()
    change = process_new_log(log)
    return {"status": "success", "message": f"Activity logged. Score change: {change:+}"}

@router.get("/nudges", response_model=List[Nudge])
def get_nudges():
    # Advanced nudges analyzing logs
    nudges = []
    if any('sugar' in log.details.lower() for log in db.logs[-3:]):
        nudges.append(Nudge(message="You've had sugar recently. Try a 10m walk to balance blood sugar levels.", urgency="medium", type="movement"))
    elif len(db.logs) == 0:
        nudges.append(Nudge(message="Log your first meal or water to start building a streak!", urgency="high", type="action"))
    else:
        nudges.append(Nudge(message="You're doing great! Keep up the good habits today.", urgency="low", type="general"))
    return nudges

@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score():
    trend = "stable"
    if db.health_score > db.baseline_score: trend = "up"
    elif db.health_score < db.baseline_score: trend = "down"
    return HealthScoreResponse(score=db.health_score, trend=trend)
