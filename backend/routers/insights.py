"""
AI insights and weekly report endpoints.
Uses Gemini for personalized Hinglish reports.
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, WeeklyReport, User
from schemas import WeeklyReportResponse
from services.gemini_service import generate_weekly_report

router = APIRouter(prefix="/api/insights", tags=["Insights"])


@router.get("/{user_id}/weekly-report", response_model=WeeklyReportResponse)
async def get_weekly_report(user_id: str, db: Session = Depends(get_db)):
    """
    Generate or retrieve this week's AI-powered sustainability report.
    Generated once per week and cached in DB.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila!")

    # Calculate week boundaries (Monday to Sunday)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # Check if report already exists for this week
    existing_report = (
        db.query(WeeklyReport)
        .filter(
            WeeklyReport.user_id == user_id,
            WeeklyReport.week_start == week_start,
        )
        .first()
    )

    if existing_report:
        return WeeklyReportResponse(
            week_start=existing_report.week_start,
            week_end=existing_report.week_end,
            report_text=existing_report.report_text,
            total_co2=existing_report.total_co2,
            best_day_co2=existing_report.best_day_co2,
            worst_day_co2=existing_report.worst_day_co2,
        )

    # Get this week's activities
    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == user_id,
            Activity.log_date >= week_start,
            Activity.log_date <= week_end,
        )
        .order_by(Activity.log_date.asc())
        .all()
    )

    if not activities:
        return WeeklyReportResponse(
            week_start=week_start,
            week_end=week_end,
            report_text=(
                "Abhi aapne is hafte koi activity log nahi ki. "
                "Pehle apna daily carbon log karo, phir weekly report milega! 🌿"
            ),
            total_co2=0.0,
            best_day_co2=None,
            worst_day_co2=None,
        )

    # Prepare data for Gemini
    total_co2 = sum(a.total_kg_co2 for a in activities)
    best_day_co2 = min(a.total_kg_co2 for a in activities)
    worst_day_co2 = max(a.total_kg_co2 for a in activities)

    weekly_data_str = "\n".join(
        f"- {a.log_date.strftime('%A')}: Total {a.total_kg_co2:.1f} kg CO2 "
        f"(Transport: {a.transport_co2:.1f}, Food: {a.food_co2:.1f}, "
        f"Energy: {a.energy_co2:.1f}, Waste: {a.waste_co2:.1f})"
        for a in activities
    )

    # Generate report via Gemini
    report_text = await generate_weekly_report(weekly_data_str)

    # Save report to DB
    report = WeeklyReport(
        user_id=user_id,
        week_start=week_start,
        week_end=week_end,
        report_text=report_text,
        total_co2=round(total_co2, 2),
        best_day_co2=round(best_day_co2, 2),
        worst_day_co2=round(worst_day_co2, 2),
    )
    db.add(report)
    db.commit()

    return WeeklyReportResponse(
        week_start=week_start,
        week_end=week_end,
        report_text=report_text,
        total_co2=round(total_co2, 2),
        best_day_co2=round(best_day_co2, 2),
        worst_day_co2=round(worst_day_co2, 2),
    )
