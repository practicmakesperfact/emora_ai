from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict

class MoodLogCreate(BaseModel):
    score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Mood score from 1 (Very bad) to 10 (Excellent)"
    )
    mood_notes: Optional[str] = Field(
        default=None,
        description="Optional detailed notes about the user's mood or day"
    )
    emotions: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific emotional tags, e.g., ['happy', 'anxious']"
    )

class MoodLogOut(BaseModel):
    id: int
    user_id: int
    score: int
    mood_notes: Optional[str] = None
    emotions: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DailyMoodAverage(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    average_score: float = Field(..., description="Average mood score for the day")
    count: int = Field(..., description="Number of logs for this day")

class MoodStatSummary(BaseModel):
    average_score: float = Field(..., description="Overall average mood score for the period")
    total_logs: int = Field(..., description="Total number of mood logs in the period")
    emotion_frequencies: Dict[str, int] = Field(
        ...,
        description="Frequency count of each emotion tag"
    )

class MoodTrendsResponse(BaseModel):
    period: str = Field(..., description="Analyzed period, e.g., 'weekly', 'monthly'")
    summary: MoodStatSummary = Field(..., description="Aggregated period statistics")
    daily_averages: List[DailyMoodAverage] = Field(
        ...,
        description="List of daily averages for charting"
    )
