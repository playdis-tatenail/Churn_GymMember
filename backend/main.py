"""
Gym Member Churn Backend
รับ CSV → ใช้ predict_churn.py (Stacking Ensemble + SHAP) → Typhoon AI → return JSON
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import os
import traceback
from typing import Any, Dict, List

# ── Import pipeline จาก predict_churn.py ──────────────────────────────────────
from predict_churn import (
    prepare_features,
    train_model,
    evaluate_model,
    build_explainer,
    compute_shap_values,
    build_report,
    generate_call_script,
    generate_staff_brief,
    TYPHOON_API_KEY,
    TYPHOON_BASE_URL,
)
from openai import OpenAI

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Gym Member Churn Backend",
    description="Backend API: Upload CSV → Stacking ML + SHAP + Typhoon AI → Churn insights",
    version="2.0.0",
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

# ── Typhoon client (ใช้ env ก่อน ถ้าไม่มีค่อยใช้จาก predict_churn config) ────
_typhoon_key = os.environ.get("TYPHOON_API_KEY", TYPHOON_API_KEY)
_typhoon_client: OpenAI | None = None
if _typhoon_key and _typhoon_key not in ("ใส่ของตัวเอง", "YOUR_API_KEY_HERE", ""):
    _typhoon_client = OpenAI(api_key=_typhoon_key, base_url=TYPHOON_BASE_URL)


# ── Helper ────────────────────────────────────────────────────────────────────
def _llm_insight(row: pd.Series) -> str:
    """เรียก Typhoon สร้าง staff brief; ถ้าไม่มี key ใช้ fallback"""
    if _typhoon_client is None:
        reasons = row.get("Churn_Reasons", "ไม่มีข้อมูล")
        return (
            f"ความเสี่ยง {row['Risk_Level']} ({row['Probability (%)']:.1f}%)"
            f" — สาเหตุ: {reasons}"
        )
    try:
        return generate_staff_brief(row, _typhoon_client)
    except Exception as e:
        return f"[LLM error] {e}"


def _llm_script(row: pd.Series) -> str:
    """เรียก Typhoon สร้าง call script; ถ้าไม่มี key ใช้ fallback"""
    if _typhoon_client is None:
        name  = row.get("Customer_Name", "ลูกค้า")
        promo = row.get("Promotion", "")
        level = row.get("Risk_Level", "")
        if level == "High Risk":
            return (
                f"สวัสดีครับคุณ {name} ช่วงนี้ทางยิมเห็นว่าคุณอาจไม่ได้เข้ามาบ่อยเหมือนเดิม "
                f"เลยอยากชวนกลับมาเริ่มใหม่พร้อมสิทธิ์ {promo} ครับ"
            )
        if level == "Medium Risk":
            return (
                f"สวัสดีครับคุณ {name} ทางยิมมีโปรโมชัน {promo} "
                f"สำหรับสมาชิกที่อยากกลับมาออกกำลังกายสม่ำเสมอครับ"
            )
        return (
            f"สวัสดีครับคุณ {name} ขอบคุณที่ยังเป็นสมาชิกกับทางยิมนะครับ "
            f"มีคำแนะนำใดๆ สามารถติดต่อทีมงานได้เลยครับ"
        )
    try:
        return generate_call_script(row, _typhoon_client)
    except Exception as e:
        return f"[LLM error] {e}"


def _safe_str(val: Any) -> str:
    import math
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    return str(val)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Gym Churn Backend v2 is running (ML + Typhoon AI)"}


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "typhoon": "connected" if _typhoon_client else "not configured (set TYPHOON_API_KEY)",
    }


@app.post("/api/predict/upload")
async def predict_upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    # ── 1. ตรวจไฟล์ ────────────────────────────────────────────────────────
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="กรุณาอัปโหลดไฟล์ .csv เท่านั้น")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"อ่านไฟล์ CSV ไม่สำเร็จ: {exc}")

    if df.empty:
        raise HTTPException(status_code=400, detail="ไฟล์ CSV ไม่มีข้อมูล")

    if "Churn" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="ไม่พบคอลัมน์ 'Churn' ในไฟล์ — โมเดลต้องการคอลัมน์นี้สำหรับ training",
        )

    # ── 2. ML Pipeline ─────────────────────────────────────────────────────
    try:
        X, X_train, X_test, y_train, y_test = prepare_features(df)
        model                                = train_model(X_train, y_train)
        y_prob, y_pred                       = evaluate_model(model, X_test, y_test)
        explainer                            = build_explainer(model, X_train)
        shap_values                          = compute_shap_values(explainer, X_test)
        report                               = build_report(df, X_test, y_test, y_prob, y_pred, shap_values)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"ML Pipeline error: {exc}")

    # ── 3. LLM (Typhoon) — สร้าง insight + script แบบ parallel ──────────────
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import threading

    rows = [row for _, row in report.iterrows()]
    total = len(rows)
    counter = {"n": 0}
    lock = threading.Lock()

    def _llm_insight_tracked(row):
        result = _llm_insight(row)
        with lock:
            counter["n"] += 1
            print(f"[Typhoon] {counter['n']}/{total} ✓", flush=True)
        return result

    def _llm_script_tracked(row):
        result = _llm_script(row)
        print(f"[Script] done", flush=True)
        return result

    print(f"[...] กำลังสร้าง AI Insight + Script สำหรับ {total} คน (parallel x8)...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        insights = list(executor.map(_llm_insight_tracked, rows))
        scripts  = list(executor.map(_llm_script_tracked,  rows))
    print(f"[OK] Typhoon AI เสร็จแล้ว ({total} คน)")
    print("[...] กำลัง build members list...")  # เพิ่มตรงนี้

    members: List[Dict[str, Any]] = []
    for row, insight, script in zip(rows, insights, scripts):
        members.append({
            "id":                _safe_str(row.get("Customer_ID", "")),
            "name":              _safe_str(row.get("Customer_Name", "")),
            "email":             _safe_str(row.get("Gmail", "")),
            "phone":             _safe_str(row.get("Phone", "")),
            "riskScore":         round(float(row["Probability (%)"]) / 100, 4),
            "status":            _safe_str(row["Risk_Level"]),
            "recommendedAction": _safe_str(row["Action"]),
            "promotion":         _safe_str(row["Promotion"]),
            "churnReasons":      _safe_str(row["Churn_Reasons"]),
            "aiInsight":         insight,
            "aiScript":          script,
        })

    # ── 4. Summary ─────────────────────────────────────────────────────────
    high   = sum(1 for m in members if m["status"] == "High Risk")
    medium = sum(1 for m in members if m["status"] == "Medium Risk")
    low    = sum(1 for m in members if m["status"] == "Low Risk")

    return {
        "total":   len(members),
        "summary": {"highRisk": high, "mediumRisk": medium, "lowRisk": low},
        "members": members,
    }
