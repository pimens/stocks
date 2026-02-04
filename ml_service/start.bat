@echo off
echo ========================================
echo  Stock ML Service - Starting...
echo ========================================
echo.

REM Navigate to ml_service directory
cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak ditemukan. Silakan install Python 3.8+ terlebih dahulu.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo [INFO] Membuat virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Gagal membuat virtual environment
        pause
        exit /b 1
    )
)

REM Install dependencies using venv python directly
echo [INFO] Menginstall dependencies...
venv\Scripts\python.exe -m pip install --upgrade pip --quiet
venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

if errorlevel 1 (
    echo [ERROR] Gagal install dependencies
    pause
    exit /b 1
)

REM Start the ML service
echo.
echo ========================================
echo  ML Service berjalan di http://localhost:8000
echo  Tekan Ctrl+C untuk menghentikan
echo ========================================
echo.

venv\Scripts\python.exe main.py
pause
