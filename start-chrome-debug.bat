@echo off
echo Starting Chrome with remote debugging...
start /d "C:\Program Files (x86)\Google\Chrome\Application" chrome.exe --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"
echo.
echo Chrome should now be running with remote debugging enabled.
echo Open http://localhost:9222/json/version in Chrome to verify.
echo.
pause
