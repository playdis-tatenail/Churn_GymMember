# Backend: Gym Churn Prediction API

## 1) เข้าโฟลเดอร์ backend
```bash
cd backend
```

## 2) สร้าง virtual environment
```bash
python -m venv venv
```

## 3) เปิด venv
Windows PowerShell:
```bash
.\venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

## 4) ติดตั้ง dependencies
```bash
pip install -r requirements.txt
```

## 5) รัน backend
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 6) ทดสอบ API
เปิด browser:
```text
http://127.0.0.1:8000/health
```

ถ้าขึ้น `{"status":"ok"}` แปลว่า backend ใช้ได้

## Endpoint หลัก
```text
POST http://127.0.0.1:8000/api/predict/upload
```

ใช้สำหรับ upload CSV แล้ว backend จะคืนค่า riskScore, status, aiInsight, aiScript ให้ frontend

## Columns ที่รองรับ
แนะนำให้มีอย่างน้อย:
- Member_ID หรือ Customer_ID
- Name หรือ Customer_Name
- Email หรือ Gmail
- Activity_Score หรือ Risk_Score

ถ้าไม่มี Activity_Score backend จะคำนวณจาก columns เช่น:
- Avg_class_frequency_current_month
- Contract_period
- Month_to_end_contract
- Avg_additional_charges_total
- Lifetime
