# 🏋️ Churn_GymMember Prediction System
ระบบวิเคราะห์และทำนายการเลิกเป็นสมาชิกของยิม (Gym Membership Churn Prediction) 
เพื่อช่วยให้เจ้าของธุรกิจวางแผนดึงดูดลูกค้าได้อย่างแม่นยำ

## 🚀 Getting Started
### RUN Backend
เปิด Terminal อันที่ 1 แล้วพิมพ์:

#cd backend
#python -m venv venv
#.\venv\Scripts\activate
#python -m pip install fastapi uvicorn pandas python-multipart
#or pip install -r requirements.txt
#python -m uvicorn main:app --host 127.0.0.1 --port 8000

ถ้าขึ้นประมาณนี้คือ Backend ติดแล้ว:
#Uvicorn running on http://127.0.0.1:8000/

***ห้ามปิด Terminal backend นี้
### 💻 Frontend Setup (React + Vite + TS)
#เปิด Terminal ใหม่อันที่ 2 แล้วพิมพ์:
#npm install
#npm run dev -- --host 127.0.0.1
**ถ้านานไปแล้วรันไม่ได้
#bun install
#bun run dev -- --host 127.0.0.1


##🛠 Tech Stack
#Frontend: React, TypeScript, Vite, TailwindCSS, Lucide React
#Backend: FastAPI, Python
#Machine Learning: Scikit-learn, Pandas (Model: predict_churn.py)
#Package Manager: Bun
