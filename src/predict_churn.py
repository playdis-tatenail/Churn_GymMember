import sys
import os
import argparse
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import StackingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
import shap
from openai import OpenAI

# ─────────────────────────────────────────────
# 0. CONFIG  (แก้ค่าตรงนี้ได้เลย)
# ─────────────────────────────────────────────
INPUT_CSV        = "input.csv"                        
OUTPUT_CSV       = f"crm_output_FULL_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
TYPHOON_API_KEY  = "ใส่ของตัวเอง"
TYPHOON_MODEL    = "typhoon-v2.5-30b-a3b-instruct"
TYPHOON_BASE_URL = "https://api.opentyphoon.ai/v1"

# columns ที่ใช้ดึงข้อมูลลูกค้ามาใส่ report
COLS_TO_PULL = [
    "Customer_ID","Customer_Name", "Gmail", "gender", "Phone", "Age",
    "Avg_class_frequency_current_month",
    "Avg_additional_charges_total",
    "Contract_period",
]

# ─────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────
def load_data(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        sys.exit(f"[ERROR] ไม่พบไฟล์: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"[OK] โหลดข้อมูลสำเร็จ: {len(df):,} แถว, {df.shape[1]} คอลัมน์")
    print(f"     Churn ratio: {df['Churn'].value_counts(normalize=True).to_dict()}")
    return df

# ─────────────────────────────────────────────
# 2. PREPARE FEATURES
# ─────────────────────────────────────────────
def prepare_features(df: pd.DataFrame):
    cols_to_drop = ["Churn", "Customer_ID", "Customer_Name", "Gmail", "Phone"]
    actual_drop = [c for c in cols_to_drop if c in df.columns]
    X = df.drop(actual_drop, axis=1)
    y = df["Churn"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"[OK] แบ่งข้อมูล → Train: {len(X_train):,}  Test: {len(X_test):,}")
    return X, X_train, X_test, y_train, y_test

# ─────────────────────────────────────────────
# 3. TRAIN STACKING MODEL
# ─────────────────────────────────────────────
def train_model(X_train, y_train):
    print("[...] กำลัง Train Stacking Ensemble (RF + XGBoost → LogReg)...")
    base_models = [
        ("rf",  RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)),
        ("xgb", XGBClassifier(eval_metric="logloss", scale_pos_weight=2.77, random_state=42)),
    ]
    stacking_model = StackingClassifier(
        estimators=base_models,
        final_estimator=LogisticRegression(),
        cv=5,
    )
    stacking_model.fit(X_train, y_train)
    print("[OK] Train เสร็จแล้ว!")
    return stacking_model

# ─────────────────────────────────────────────
# 4. EVALUATE MODEL
# ─────────────────────────────────────────────
def evaluate_model(model, X_test, y_test):
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    print("\n" + "="*50)
    print("ผลลัพธ์ Stacking Ensemble")
    print("="*50)
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("="*50 + "\n")
    return y_prob, y_pred

# ─────────────────────────────────────────────
# 5. BUSINESS LOGIC
# ─────────────────────────────────────────────
def risk_level(prob: float) -> str:
    if prob >= 0.70:
        return "High Risk"
    elif prob >= 0.40:
        return "Medium Risk"
    return "Low Risk"

def alert_action(prob: float) -> str:
    if prob >= 0.70:
        return "โทรหาลูกค้า"
    elif prob >= 0.40:
        return "ส่งโปรโมชัน"
    return "ดูแลปกติ"

def promotion_action(prob: float) -> str:
    if prob >= 0.70:
        return "ส่วนลด 20% + PT ฟรี"
    elif prob >= 0.40:
        return "ส่วนลดเล็กน้อย"
    return "ไม่ต้องโปรโมชัน"

# ─────────────────────────────────────────────
# 6. SHAP EXPLAINABILITY
# ─────────────────────────────────────────────
def build_explainer(model, X_train):
    print("[...] กำลังสร้าง SHAP Explainer (ใช้เวลาสักครู่)...")
    background = shap.kmeans(X_train, 10)
    explainer = shap.KernelExplainer(model.predict_proba, background)
    print("[OK] Explainer พร้อมแล้ว")
    return explainer

def compute_shap_values(explainer, X_test):
    n = len(X_test)
    print(f"[...] คำนวณ SHAP สำหรับ {n:,} คน... (ชงกาแฟรอได้เลย)")
    shap_values = explainer.shap_values(X_test)
    print("[OK] SHAP คำนวณเสร็จแล้ว")
    return shap_values

def get_shap_reasons(customer_idx: int, shap_values, feature_names) -> str:
    try:
        if isinstance(shap_values, list):
            idx = 1 if len(shap_values) > 1 else 0
            vals = shap_values[idx][customer_idx]
        elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
            vals = shap_values[customer_idx, :, 1]
        else:
            vals = shap_values[customer_idx]
            if hasattr(vals, "ndim") and vals.ndim > 1:
                vals = vals.flatten()

        vals = np.array(vals).flatten()
        importances = pd.Series(vals, index=feature_names)
        top = importances[importances > 0].sort_values(ascending=False).head(2)
        return ", ".join(top.index.tolist()) if not top.empty else "ไม่มีปัจจัยหลักชัดเจน"
    except Exception as e:
        return f"ไม่สามารถดึงข้อมูลได้: {e}"

# ─────────────────────────────────────────────
# 7. BUILD FINAL REPORT
# ─────────────────────────────────────────────
def build_report(df, X_test, y_test, y_prob, y_pred, shap_values) -> pd.DataFrame:
    print("[...] กำลังประกอบรายงานผลลัพธ์...")

    results = []
    for i, prob in enumerate(y_prob):
        results.append({
            "Risk_Level":    risk_level(prob),
            "Action":        alert_action(prob),
            "Promotion":     promotion_action(prob),
            "Churn_Reasons": get_shap_reasons(i, shap_values, X_test.columns),
        })
    summary_df = pd.DataFrame(results)

    meta = df.loc[X_test.index, COLS_TO_PULL].copy()

    report = pd.DataFrame({
        "Customer_ID":    df.loc[X_test.index, "Customer_ID"].values,
        "Customer_Name":  meta["Customer_Name"].values,
        "Gmail":          meta["Gmail"].values,
        "Phone":          meta["Phone"].values,
        "Gender":         meta["gender"].map({0: "Female", 1: "Male"}).values,
        "Age":            meta["Age"].values,
        "Actual_Churn":   y_test.values if hasattr(y_test, "values") else y_test,
        "Probability (%)": (y_prob * 100).round(2),
        "Prediction":     y_pred,
        "Risk_Level":     summary_df["Risk_Level"].values,
        "Action":         summary_df["Action"].values,
        "Promotion":      summary_df["Promotion"].values,
        "Churn_Reasons":  summary_df["Churn_Reasons"].values,
        "Class_Freq":     meta["Avg_class_frequency_current_month"].values,
        "Add_Charges":    meta["Avg_additional_charges_total"].values,
    })
    return report

# ─────────────────────────────────────────────
# 8. TYPHOON AI — CALL SCRIPTS
# ─────────────────────────────────────────────
FEATURE_TH = {
    "Avg_class_frequency_current_month": "การเข้าคลาสในเดือนนี้ลดลงอย่างเห็นได้ชัด",
    "Avg_additional_charges_total":      "ไม่มีการซื้อบริการเสริมเพิ่มเติมเลย",
    "Lifetime":                          "เป็นสมาชิกมานานแต่ช่วงนี้เริ่มเงียบหายไป",
    "Contract_period":                   "ใกล้จะหมดสัญญาการใช้งาน",
    "Month_to_end_contract":             "เหลือระยะเวลาสัญญาอีกไม่มาก",
    "Age":                               "ปัจจัยเรื่องอายุ",
    "Gender":                            "เพศ",
}

def translate_reasons(text: str) -> str:
    for eng, th in FEATURE_TH.items():
        text = text.replace(eng, th)
    return text

def generate_call_script(row: pd.Series, client: OpenAI) -> str:
    reasons_th = translate_reasons(row["Churn_Reasons"])
    prompt = f"""
คุณเป็นพนักงานดูแลลูกค้า (Customer Success) ของฟิตเนส ชื่อว่า "เจมส์"
เป้าหมาย: โทรไปหาลูกค้าเพื่อรั้งไม่ให้เขาลาออก (Churn)

ข้อมูลลูกค้าจริงที่ต้องใช้:
- ชื่อ: {row['Customer_Name']}
- อีเมล: {row['Gmail']}
- เพศ: {row['Gender']}
- อายุ: {row['Age']} ปี
- ความเสี่ยง: {row['Risk_Level']} (โอกาสลาออก {row['Probability (%)']}%)
- สาเหตุที่ AI ตรวจพบ: {reasons_th}
- สิ่งที่ต้องมอบให้ลูกค้า: {row['Promotion']}

คำสั่ง:
1. เขียนสคริปต์การโทรที่เป็นภาษาไทยแบบเป็นกันเอง อบอุ่น แต่สุภาพ
2. ห้ามใช้เครื่องหมาย [ ] ให้ใช้คำว่า "คุณลูกค้า" แทน
3. ต้องพูดถึงสาเหตุที่ AI ตรวจพบแบบเนียนๆ
4. ต้องเสนอโปรโมชันในช่วงท้ายการคุย
5. ไม่ต้องเขียนส่วนนำ ให้เริ่มที่สคริปต์การโทรเลย
"""
    resp = client.chat.completions.create(
        model=TYPHOON_MODEL,
        messages=[
            {"role": "system", "content": "คุณคือผู้ช่วยอัจฉริยะที่ช่วยเขียนสคริปต์ดูแลลูกค้า"},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.2,
        top_p=0.9,
    )
    return resp.choices[0].message.content

def generate_staff_brief(row: pd.Series, client: OpenAI) -> str:
    reasons_th = translate_reasons(row["Churn_Reasons"])
    prompt = f"""
[Internal Briefing: Customer Management]
จงสรุปข้อมูลลูกค้าเพื่อให้พนักงานใช้ประกอบการตัดสินใจ (ไม่ต้องมีคำทักทายหรือเกริ่นนำ)

ข้อมูลดิบ:
- ID: {row['Customer_ID']}
- เพศ/อายุ: {row['Gender']} / {row['Age']} ปี
- ความเสี่ยง: {row['Risk_Level']} ({row['Probability (%)']}%)
- สาเหตุสำคัญ: {reasons_th}
- สิ่งที่ต้องทำ: {row['Action']}
- ข้อเสนอ: {row['Promotion']}

รูปแบบที่ต้องการ:
- สรุปสั้นๆ เป็นข้อๆ
- บอกจุดที่ต้องระวัง (Key Insight)
- แนะนำประโยคเปิดการสนทนา 1 ประโยค (Ice Breaker)
"""
    resp = client.chat.completions.create(
        model=TYPHOON_MODEL,
        messages=[
            {"role": "system", "content": "คุณคือผู้ช่วยวิเคราะห์ข้อมูลลูกค้าหลังบ้าน ทำงานแม่นยำ ห้ามตัดข้อมูล ID หรือตัวเลขสำคัญทิ้ง"},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
    )
    return resp.choices[0].message.content

def demo_typhoon(report: pd.DataFrame, client: OpenAI, demo_idx: int = 0):
    row = report.iloc[demo_idx]
    print("\n" + "="*50)
    print(f"DEMO: สคริปต์โทรหาลูกค้า (index {demo_idx})")
    print("="*50)
    print(generate_call_script(row, client))

    print("\n" + "="*50)
    print(f"DEMO: ข้อมูลสำหรับพนักงาน (index {demo_idx})")
    print("="*50)
    print(generate_staff_brief(row, client))

# ─────────────────────────────────────────────
# 9. MAIN
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Gym Churn Prediction — Stacking Ensemble + Typhoon AI"
    )
    parser.add_argument("csv_path", help="Path ของไฟล์ CSV ข้อมูลลูกค้า")
    parser.add_argument(
        "--no-typhoon", action="store_true",
        help="ข้าม Typhoon AI demo (ใช้เมื่อไม่มี API Key)"
    )
    parser.add_argument(
        "--demo-idx", type=int, default=0,
        help="Index ของลูกค้าที่จะใช้ demo Typhoon (default: 0)"
    )
    args = parser.parse_args()

    # ── Step 1: โหลดข้อมูล ──
    df = load_data(args.csv_path)

    # ── Step 2: เตรียม Feature ──
    X, X_train, X_test, y_train, y_test = prepare_features(df)

    # ── Step 3: Train โมเดล ──
    model = train_model(X_train, y_train)

    # ── Step 4: ประเมินผล ──
    y_prob, y_pred = evaluate_model(model, X_test, y_test)

    # ── Step 5: SHAP ──
    explainer   = build_explainer(model, X_train)
    shap_values = compute_shap_values(explainer, X_test)

    # ── Step 6: สร้างรายงาน ──
    report = build_report(df, X_test, y_test, y_prob, y_pred, shap_values)

    timestamp   = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = f"crm_output_FULL_{timestamp}.csv"
    report.to_csv(output_path, index=False)
    print(f"[OK] บันทึกผลลัพธ์ → {output_path}  ({len(report):,} แถว)")

    # Risk summary
    print("\nสรุประดับความเสี่ยง:")
    print(report["Risk_Level"].value_counts().to_string())

    # ── Step 7: Typhoon AI demo (optional) ──
    if not args.no_typhoon:
        if TYPHOON_API_KEY == "YOUR_API_KEY_HERE":
            print("\n[WARN] ไม่พบ TYPHOON_API_KEY — ข้าม Typhoon demo")
            print("       ตั้งค่าได้ด้วย: export TYPHOON_API_KEY=sk-xxxx")
        else:
            try:
                client = OpenAI(api_key=TYPHOON_API_KEY, base_url=TYPHOON_BASE_URL)
                demo_typhoon(report, client, demo_idx=args.demo_idx)
            except Exception as e:
                print(f"[WARN] Typhoon error: {e}")

    print("\n✅ เสร็จสิ้น!")

if __name__ == "__main__":
    main()
