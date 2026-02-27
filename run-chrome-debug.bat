@echo off
echo Closing all Chrome instances...
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 >nul

echo Starting Chrome with remote debugging...
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --no-first-run

echo.
echo Chrome started with remote debugging on port 9222
echo.
echo To verify: Open a new tab in Chrome and go to http://localhost:9222/json/version
echo You should see JSON output if it's working correctly.
echo.
echo Keep this Chrome window open and try the auto-apply feature.
echo.
pause
