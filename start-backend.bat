@echo off
REM Create and activate a virtual environment, install dependencies, and run the Flask backend.
cd /d "%~dp0backend"

if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
set FLASK_APP=app.py
set FLASK_ENV=development
flask run
