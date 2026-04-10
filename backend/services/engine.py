from datetime import datetime
from typing import List, Dict
from models.schemas import ActivityLog, MealRecommendation, Nudge, Insight, UserProfile

# In-memory Data (Database mock)
class DataStore:
    def __init__(self):
        self.profile = UserProfile()
        self.logs: List[ActivityLog] = []
        self.health_score = 75
        self.baseline_score = 75

db = DataStore()

# ----------------- Intelligence -----------------

def get_smart_recommendations() -> List[MealRecommendation]:
    """Generates recommendations based on goal, time of day, and diet preference."""
    hour = datetime.now().hour
    goal = db.profile.goal
    diet = db.profile.diet
    
    meals = []

    # Filter base on Time
    if hour >= 20: 
        # Night -> Light Foods
        meals.append(MealRecommendation(id=101, name="Chamomile Tea & Almonds", calories=150, protein_g=6, carbs_g=5, fats_g=12, sugar_g=1, reason="Late night friendly. Almonds help melatonin production."))
        if diet != "vegan":
            meals.append(MealRecommendation(id=102, name="Cottage Cheese & Berries", calories=200, protein_g=20, carbs_g=15, fats_g=5, sugar_g=8, reason="Slow-digesting casein protein for overnight repair."))
        return meals

    # Filter based on Goal
    if goal == "lose":
        meals.extend([
            MealRecommendation(id=201, name="Zucchini Noodle Salad", calories=250, protein_g=12, carbs_g=18, fats_g=15, sugar_g=4, reason="Low calorie and filling volume."),
        ])
        if diet not in ["vegetarian", "vegan"]:
            meals.append(MealRecommendation(id=202, name="Lemon Herb Chicken Breast", calories=300, protein_g=45, carbs_g=2, fats_g=10, sugar_g=0, reason="High protein, low cal for fat loss."))
            
    elif goal == "gain":
        meals.extend([
            MealRecommendation(id=301, name="Lentil & Quinoa Power Bowl", calories=600, protein_g=25, carbs_g=85, fats_g=18, sugar_g=5, reason="Dense carbs and protein for muscle growth."),
        ])
        if diet not in ["vegetarian", "vegan"]:
            meals.append(MealRecommendation(id=302, name="Steak & Sweet Potato Mash", calories=750, protein_g=55, carbs_g=60, fats_g=25, sugar_g=8, reason="Maximum protein and glycogen replenishment."))
            
    else: # Maintain/Energy
        meals.extend([
            MealRecommendation(id=401, name="Avocado & Egg Toast", calories=350, protein_g=14, carbs_g=22, fats_g=20, sugar_g=2, reason="Balanced macros for sustained energy.")
        ])
        if diet not in ["vegan"]:
             meals.append(MealRecommendation(id=402, name="Greek Yogurt Parfait", calories=280, protein_g=22, carbs_g=30, fats_g=4, sugar_g=12, reason="Probiotics and quick energy."))
    
    return meals

def analyze_behavior() -> List[Insight]:
    """Generates insights by sweeping through logged behaviors."""
    insights = []
    
    # Simple static logic for the hackathon without ML
    has_sugar = any('sugar' in log.details.lower() or 'candy' in log.details.lower() for log in db.logs)
    has_water = any(log.activity_type == 'water' for log in db.logs[-5:]) # Last 5 logs
    
    if has_sugar:
         insights.append(Insight(type="warning", title="Sugar Detected", desc="You've logged high sugar items recently. Watch out for crashes.", severity="bad"))
    else:
         insights.append(Insight(type="praise", title="Sugar Control", desc="No refined sugar logged. Great discipline!", severity="good"))
         
    if has_water:
         insights.append(Insight(type="praise", title="Consistent Hydration", desc="You are keeping up with your water intake well today.", severity="good"))
    else:
         insights.append(Insight(type="neutral", title="Dehydration Risk", desc="You haven't logged water recently.", severity="neutral"))

    return insights

def process_new_log(log: ActivityLog) -> int:
    """Updates the health score dynamically."""
    db.logs.append(log)
    details = log.details.lower()
    
    change = 0
    if log.activity_type == 'water': change = 2
    elif log.activity_type == 'exercise': change = 10
    elif log.activity_type == 'sleep': change = 8
    elif log.activity_type == 'meal':
        if any(w in details for w in ['salad', 'chicken', 'fish', 'veg']): change = 5
        elif any(w in details for w in ['burger', 'candy', 'sugar', 'pizza']): change = -5
        else: change = 1
        
    db.health_score = max(0, min(100, db.health_score + change))
    return change
