@echo off

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo npm is not installed. Please install it first.
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install it first.
    exit /b 1
)

REM Navigate to the sse-server directory and run npm install
cd sse-server
npm install

REM Start the npm application in a new window
start "SSE Server" cmd /c npm start

cd ..

REM Navigate to the sse-client directory and run npm install
cd sse-client
npm install

REM Start the npm application in a new window
start "SSE Client" cmd /c npm start

cd ..

REM Run the Python scripts
python udapi.py
python action.py
python comparator.py
