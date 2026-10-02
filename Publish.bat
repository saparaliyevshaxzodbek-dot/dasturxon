@echo off
chcp 65001 >nul
title Dasturxon - serverga tayyorlash
cd /d "%~dp0"

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>nul || (echo [!] Node.js topilmadi: https://nodejs.org & pause & exit /b 1)

echo Sayt va API "publish" papkasiga yig'ilmoqda...
if exist publish rmdir /s /q publish
dotnet publish src\Restaurant.WebApi -c Release -o publish
if errorlevel 1 (echo [!] Xatolik yuz berdi. & pause & exit /b 1)

copy /y deploy\appsettings.Production.example.json publish\appsettings.Production.json >nul

echo.
echo   Tayyor: %~dp0publish
echo   Serverga shu papkani ko'chiring va publish\appsettings.Production.json ni to'ldiring.
echo   Batafsil: README.md, "Serverga joylash" bo'limi.
echo.
pause
