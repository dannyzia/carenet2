@echo off
cd /d "%~dp0"
echo Starting translation script...
echo.
node translate_all.mjs
echo.
pause
