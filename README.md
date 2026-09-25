# SnapAPI

SnapAPI is a lightweight micro-API mocking engine for developers. It allows you to quickly create mock endpoints with custom JSON payloads and status codes, effectively giving you a cardboard-cutout backend to build your frontend against without waiting.

This project was built using a beginner-friendly stack:
- **Frontend**: React (Vite), Plain CSS, React Router
- **Backend**: Python (Flask)
- **Database**: SQLite

## Prerequisites
- Node.js (v16+)
- Python (3.8+)

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask server:
   ```bash
   python app.py
   ```
   The backend will start at `http://127.0.0.1:5001`. The SQLite database (`snapapi.db`) will be created automatically.

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Usage
- Register an account or log in. (Hint: registering with email `admin@snapapi.com` creates an admin user).
- Create a new endpoint by specifying the title, status code, and JSON payload.
- Use the generated Mock URL in your frontend projects.
