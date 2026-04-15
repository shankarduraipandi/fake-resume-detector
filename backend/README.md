# AI Fake Resume Detection System Backend

Simple Flask backend for the frontend flow:

`Upload -> Extract -> OTP -> Verify -> GitHub/LinkedIn -> Score -> Job Suggestions`

## Project Structure

```text
backend/
  app.py
  config.py
  database.py
  models/
  routes/
  services/
  utils/
  uploads/
  requirements.txt
```

## 1. PostgreSQL Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE fake_resume_detector;
```

Default connection string used in `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fake_resume_detector
```

Update username, password, host, or database name as needed.

## 2. Environment Setup

From the `backend` folder:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Then edit `.env` and fill in:

- `DATABASE_URL`
- `GEMINI_API_KEY`
- `TWILIO_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE`

## 3. Run the Server

```powershell
python app.py
```

The backend will start on:

```text
http://localhost:5000
```

Tables are created automatically on first run using SQLAlchemy `create_all()`.

## 4. API Endpoints

- `POST /upload`
- `POST /extract`
- `POST /send-otp`
- `POST /verify-otp`
- `POST /verify-github`
- `POST /verify-linkedin`
- `POST /calculate-score`
- `POST /job-suggestions`
- `POST /analyze`

## 5. Notes

- `/send-otp` accepts either `phone` or `email`.
- If only `email` is sent, the backend tries to find the matching phone from extracted user data.
- If Twilio fails, the OTP is printed in the backend console.
- If Gemini fails, fallback mock or heuristic data is returned.
- `/analyze` is included to match the current frontend service flow more easily.
