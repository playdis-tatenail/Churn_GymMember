# วิธีรันโปรเจกต์ Frontend + Backend

## 1) รัน Backend ก่อน
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

เช็กว่า backend ทำงาน:
```text
http://127.0.0.1:8000/health
```

## 2) เปิดอีก Terminal แล้วรัน Frontend
```bash
npm install
npm run dev
```

เปิดเว็บตามลิงก์ที่ terminal แสดง เช่น:
```text
http://localhost:5173
```

## 3) วิธีทดสอบ
1. กดปุ่ม Import CSV
2. เลือกไฟล์ `backend/sample_members.csv`
3. กด Send to Backend
4. ระบบจะส่งไฟล์ไป backend แล้วแสดงผล Risk ใน Dashboard
5. กด Marketing Mode เพื่อดู AI Insight และ Draft Message

## ส่วน Backend ที่ทำเพิ่ม
- `backend/main.py` สร้าง API ด้วย FastAPI
- `backend/requirements.txt` รายการ package สำหรับ backend
- `backend/sample_members.csv` ไฟล์ตัวอย่างสำหรับทดสอบ
- แก้ `src/ImportData.tsx` ให้ upload CSV ไป backend
- แก้ `src/App.tsx` ให้รับข้อมูลจาก backend
- แก้ `src/AdsView.tsx` ให้ใช้ aiInsight และ aiScript จาก backend

## Update: Email Sent Flow

เพิ่มระบบ Email Status แล้ว

- หน้า Dashboard มีคอลัมน์ Email และ Email Status
- หน้า Marketing จะแสดงเฉพาะสมาชิกกลุ่มเสี่ยงที่ยังไม่ได้ส่งอีเมล
- เมื่อกดปุ่ม Mail หรือ Mark as Sent ในหน้า Marketing ระบบจะเปลี่ยนสถานะเป็น Sent
- สมาชิกที่ Sent แล้วจะไม่ขึ้นในตาราง Marketing อีก
- หน้า Marketing มีตาราง Email Sent Log สำหรับดูรายการที่ส่งแล้ว
- สถานะ Sent ถูกเก็บใน localStorage ของ browser ถ้าต้องการล้างสถานะให้กดปุ่ม Reset Email Sent บน Dashboard
