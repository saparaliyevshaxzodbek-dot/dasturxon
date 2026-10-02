@echo off
chcp 65001 >nul
title Dasturxon - restoran boshqaruv tizimi
cd /d "%~dp0"

rem Node.js may be installed after this window's parent process started, so add its default folder.
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"

where dotnet >nul 2>nul || (echo [!] .NET SDK topilmadi: https://dotnet.microsoft.com/download & pause & exit /b 1)
where npm >nul 2>nul || (echo [!] Node.js topilmadi: https://nodejs.org & pause & exit /b 1)

if not exist "src\Restaurant.Web\node_modules" (
  echo Frontend paketlari o'rnatilmoqda, faqat birinchi marta...
  pushd src\Restaurant.Web
  call npm install
  popd
)

rem Opens the browser as soon as the site answers; pass "nobrowser" to skip it.
if /i not "%~1"=="nobrowser" (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "while ($true) { try { (New-Object Net.Sockets.TcpClient('localhost', 5173)).Close(); break } catch { Start-Sleep -Milliseconds 700 } }; Start-Process 'http://localhost:5173'"
)

echo.
echo   Sayt:             http://localhost:5173
echo   Xodimlar paneli:  http://localhost:5173/admin
echo   API - Swagger:    http://localhost:5011/swagger
echo   To'xtatish:       shu oynani yoping yoki Ctrl+C
echo.

dotnet run --project src\Restaurant.WebApi --launch-profile "Sayt + API"
