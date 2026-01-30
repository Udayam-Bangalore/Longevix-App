from pydantic import BaseModel
from typing import List, Literal


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class FoodItem(BaseModel):
    name: str
    quantity: float
    unit: str = "g"


class GenerateNutrientsRequest(BaseModel):
    isAuthenticated: bool
    food: List[FoodItem]
    time: Literal["breakfast", "snack", "dinner", "lunch", "Breakfast", "Lunch", "Snack", "Dinner"]


class NutrientInfo(BaseModel):
    calories: float
    fat: float
    protein: float
    carbohydrates: float
    micronutrients: dict


class FoodItemWithNutrients(BaseModel):
    name: str
    quantity: float
    unit: str
    calories: float
    fat: float
    protein: float
    carbohydrates: float
    micronutrients: dict


class GenerateNutrientsResponse(BaseModel):
    total: NutrientInfo
    items: List[FoodItemWithNutrients]
