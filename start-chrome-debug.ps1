$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromePath) {
    Write-Host "Starting Chrome with remote debugging..."
    Start-Process -FilePath $chromePath -ArgumentList "--remote-debugging-port=9222" -NoNewWindow
    Write-Host "Chrome started with remote debugging on port 9222"
    Write-Host "Verify by opening: http://localhost:9222/json/version"
} else {
    Write-Host "Chrome not found at: $chromePath"
}
