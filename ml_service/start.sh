#!/bin/bash

echo "========================================"
echo " Stock ML Service - Starting..."
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 tidak ditemukan. Silakan install Python 3.8+ terlebih dahulu."
    exit 1
fi

# Navigate to ml_service directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[INFO] Membuat virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "[INFO] Mengaktifkan virtual environment..."
source venv/bin/activate

# Install dependencies
echo "[INFO] Menginstall dependencies..."
pip install -r requirements.txt --quiet

# Start the ML service
echo ""
echo "========================================"
echo " ML Service berjalan di http://localhost:8000"
echo " Tekan Ctrl+C untuk menghentikan"
echo "========================================"
echo ""

python main.py
