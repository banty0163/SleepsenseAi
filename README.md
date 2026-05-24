# 🌙 SleepSense AI — Sleep Disorder Diagnosis Platform

A full-stack AI-powered sleep disorder diagnosis web application for **educational purposes**, featuring real machine learning predictions, professional PDF reports, and interactive dashboards.

---

## 📁 Project Structure

```
sleep-ai-app/
├── frontend/           # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-level pages
│   │   ├── context/    # React Context (Auth, etc.)
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils/      # API helpers
│   └── package.json
│
├── backend/            # Node.js + Express
│   ├── routes/         # API route handlers
│   ├── models/         # Mongoose schemas
│   ├── middleware/      # Auth, validation
│   ├── utils/          # PDF generation
│   └── server.js
│
├── ai-service/         # Python FastAPI + Scikit-learn
│   ├── main.py         # FastAPI app
│   ├── train_model.py  # Model training script
│   ├── model/          # Saved model files
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)

---

### 1. 🤖 AI Service Setup (Python FastAPI)

```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (generates model/sleep_model.pkl)
python train_model.py

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

AI service runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

### 2. 🖥️ Backend Setup (Node.js Express)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 3. 🎨 Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔐 Environment Variables

### Backend `.env`
```
MONGODB_URI=mongodb://localhost:27017/sleepsense
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

---

## 🌐 API Endpoints

### Backend (Express)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/predict` | Submit assessment & get AI prediction |
| GET | `/api/history` | Get user's prediction history |
| GET | `/api/history/:id` | Get single prediction |
| GET | `/api/download-report/:userId` | Download PDF report |
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### AI Service (FastAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Get sleep disorder prediction |
| GET | `/health` | Health check |
| GET | `/model-info` | Model information |

---

## 🧠 ML Model

- **Algorithm**: Random Forest Classifier + Gradient Boosting Ensemble
- **Dataset**: Sleep Health and Lifestyle Dataset (synthetic + augmented)
- **Features**: Age, Gender, Sleep Duration, Stress Level, BMI, Heart Rate, Physical Activity, Snoring, Daytime Sleepiness, Sleep Interruptions
- **Predictions**: None, Insomnia, Sleep Apnea, Narcolepsy, Restless Legs Syndrome
- **Output**: Disorder + Risk Level + Confidence Score

---

## ⚠️ Disclaimer

This application is built for **educational purposes only**. The AI predictions are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for sleep-related health concerns.
