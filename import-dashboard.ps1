# PowerShell script to import dashboard
$config = Get-Content "config.json" | ConvertFrom-Json
$baseUrl = "http://$($config.apiHost):$($config.apiPort)"

$headers = @{
    "Authorization" = "Bearer $($config.apiKey)"
    "Content-Type" = "application/json"
}

$dashboardContent = Get-Content "skew-dashboard-final.json" -Raw | ConvertFrom-Json
$payload = @{
    dashboard = $dashboardContent
    overwrite = $true
} | ConvertTo-Json -Depth 20

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dashboards/db" -Method Post -Headers $headers -Body $payload
    Write-Host "✅ Dashboard imported successfully!" -ForegroundColor Green
    Write-Host "Dashboard ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Dashboard URL: $($response.url)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Import failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
}