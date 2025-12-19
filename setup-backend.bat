@echo off
echo Setting up Grafana Mirror Backend...

cd server

echo Installing dependencies...
npm install

echo Creating .env file...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your PostgreSQL connection details
)

echo Setup complete!
echo.
echo To start the backend server:
echo   cd server
echo   npm run dev
echo.
echo Backend will run on http://localhost:3001
pause