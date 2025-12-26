# PowerShell script to import dashboard
$headers = @{
    "Authorization" = "Bearer gm_2a448ee92faed3a47ed62c4006fc8d369e70fbca5dc893ff2b3d1e2ce6180559"
    "Content-Type" = "application/json"
}

$dashboardContent = Get-Content "skew-dashboard-final.json" -Raw | ConvertFrom-Json
$payload = @{
    dashboard = $dashboardContent
    overwrite = $true
} | ConvertTo-Json -Depth 20

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/dashboards/db" -Method Post -Headers $headers -Body $payload
    Write-Host "✅ Dashboard imported successfully!" -ForegroundColor Green
    Write-Host "Dashboard ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Dashboard URL: $($response.url)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Import failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
}