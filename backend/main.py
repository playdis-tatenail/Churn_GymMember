from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import math
from typing import Any, Dict, List, Optional

app = FastAPI(
    title="Gym Member Churn Backend",
    description="Backend API for uploading gym member CSV files and returning churn-risk results.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MemberResult(BaseModel):
    id: str
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    riskScore: float
    status: str
    aiInsight: str
    aiScript: str
    recommendedAction: str


def safe_value(row: pd.Series, candidates: List[str], default: Any = "") -> Any:
    """Read a value from possible column names."""
    lower_map = {str(c).strip().lower(): c for c in row.index}
    for key in candidates:
        col = lower_map.get(key.lower())
        if col is not None:
            value = row.get(col)
            if pd.notna(value):
                return value
    return default


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return float(value)
    except Exception:
        return default


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def normalize_activity_score(raw_score: Any) -> Optional[float]:
    """Accept Activity_Score as 0-1, 0-100, or reversed activity score."""
    if raw_score is None or raw_score == "":
        return None
    score = to_float(raw_score, default=-1)
    if score < 0:
        return None
    if score > 1:
        score = score / 100.0
    return clamp(score)


def calculate_risk(row: pd.Series) -> float:
    """
    Rule-based churn risk for demo/backend integration.
    ถ้ามี Activity_Score จะใช้ค่านั้นเป็น risk โดยตรง
    ถ้าไม่มี จะคำนวณจากพฤติกรรมการเข้าใช้งาน, สัญญา และค่าใช้จ่ายเสริม
    """
    direct_risk = normalize_activity_score(safe_value(row, ["Activity_Score", "Risk_Score", "riskScore"], ""))
    if direct_risk is not None:
        return round(direct_risk, 4)

    freq = to_float(safe_value(row, ["Avg_class_frequency_current_month", "Class_Freq", "Frequency"], 0))
    contract = to_float(safe_value(row, ["Contract_period", "Contract", "Contract_Period"], 1), 1)
    months_left = to_float(safe_value(row, ["Month_to_end_contract", "Months_Left"], contract), contract)
    charges = to_float(safe_value(row, ["Avg_additional_charges_total", "Add_Charges"], 0))
    lifetime = to_float(safe_value(row, ["Lifetime"], 1), 1)

    risk = 0.15
    if freq <= 0.5:
        risk += 0.42
    elif freq <= 1.5:
        risk += 0.25
    elif freq <= 2.5:
        risk += 0.12

    if months_left <= 1:
        risk += 0.18
    elif months_left <= 3:
        risk += 0.10

    if contract <= 1:
        risk += 0.10
    if charges <= 20:
        risk += 0.08
    if lifetime <= 2:
        risk += 0.07

    return round(clamp(risk), 4)


def get_status(score: float) -> str:
    if score >= 0.70:
        return "High Risk"
    if score >= 0.40:
        return "Medium Risk"
    return "Low Risk"


def get_action(score: float) -> str:
    if score >= 0.70:
        return "โทรติดตาม + เสนอ Personal Trainer ฟรี 1 ครั้ง"
    if score >= 0.40:
        return "ส่งโปรโมชัน/ข้อความกระตุ้นให้กลับมาออกกำลังกาย"
    return "ดูแลตามปกติ"


def build_insight(row: pd.Series, score: float) -> str:
    freq = safe_value(row, ["Avg_class_frequency_current_month", "Class_Freq", "Frequency"], "ไม่พบข้อมูล")
    months_left = safe_value(row, ["Month_to_end_contract", "Months_Left"], "ไม่พบข้อมูล")
    charges = safe_value(row, ["Avg_additional_charges_total", "Add_Charges"], "ไม่พบข้อมูล")

    if score >= 0.70:
        return f"ลูกค้ามีความเสี่ยงสูง ควรรีบติดต่อ เนื่องจากความถี่เข้าใช้บริการเดือนนี้ = {freq}, ระยะสัญญาคงเหลือ = {months_left}, ค่าใช้จ่ายเสริม = {charges}"
    if score >= 0.40:
        return f"ลูกค้ามีความเสี่ยงปานกลาง ควรกระตุ้นด้วยโปรโมชันหรือข้อความติดตาม ความถี่เข้าใช้บริการเดือนนี้ = {freq}"
    return f"ลูกค้ามีความเสี่ยงต่ำ ยังมีพฤติกรรมค่อนข้างปกติ ความถี่เข้าใช้บริการเดือนนี้ = {freq}"


def build_script(name: str, score: float) -> str:
    if score >= 0.70:
        return f"สวัสดีครับคุณ {name} ช่วงนี้ทางยิมเห็นว่าคุณอาจไม่ได้เข้ามาใช้บริการบ่อยเหมือนเดิม เลยอยากชวนกลับมาเริ่มใหม่อีกครั้ง พร้อมมอบสิทธิ์ Personal Trainer ฟรี 1 ครั้งครับ"
    if score >= 0.40:
        return f"สวัสดีครับคุณ {name} ทางยิมมีโปรโมชันพิเศษสำหรับสมาชิกที่อยากกลับมาออกกำลังกายอย่างต่อเนื่อง สนใจรับรายละเอียดเพิ่มเติมไหมครับ"
    return f"สวัสดีครับคุณ {name} ขอบคุณที่ยังเป็นสมาชิกกับทางยิมนะครับ หากต้องการคำแนะนำเรื่องคลาสหรือการออกกำลังกาย สามารถติดต่อทีมงานได้เลยครับ"


def row_to_result(row: pd.Series, index: int) -> MemberResult:
    member_id = str(safe_value(row, ["Member_ID", "Customer_ID", "id", "ID"], f"MEM-{index+1:03d}"))
    name = str(safe_value(row, ["Name", "Customer_Name", "member_name"], "Unknown Member"))
    email = str(safe_value(row, ["Email", "Gmail", "email"], ""))
    phone = str(safe_value(row, ["Phone", "phone"], ""))
    risk = calculate_risk(row)
    return MemberResult(
        id=member_id,
        name=name,
        email=email,
        phone=phone,
        riskScore=risk,
        status=get_status(risk),
        aiInsight=build_insight(row, risk),
        aiScript=build_script(name, risk),
        recommendedAction=get_action(risk),
    )


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Gym Churn Backend is running"}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/predict/upload")
async def predict_upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์ .csv เท่านั้น")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"อ่านไฟล์ CSV ไม่สำเร็จ: {exc}")

    if df.empty:
        raise HTTPException(status_code=400, detail="ไฟล์ CSV ไม่มีข้อมูล")

    results = [row_to_result(row, i).model_dump() for i, (_, row) in enumerate(df.iterrows())]
    high = sum(1 for r in results if r["status"] == "High Risk")
    medium = sum(1 for r in results if r["status"] == "Medium Risk")
    low = sum(1 for r in results if r["status"] == "Low Risk")

    return {
        "total": len(results),
        "summary": {"highRisk": high, "mediumRisk": medium, "lowRisk": low},
        "members": results,
    }
