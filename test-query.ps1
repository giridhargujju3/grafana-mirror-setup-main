# Test PostgreSQL query with API key authentication
$config = Get-Content "config.json" | ConvertFrom-Json
$apiKey = "gm_ce921d2224d27232cd17f530f0939107c6bf2fb7fe7b4e52a0d4b559bc23b091"
$baseUrl = "http://$($config.apiHost):$($config.apiPort)"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

$body = @{
    queries = @(
        @{
            refId = "A"
            datasource = "ds-1766647484377"
            rawSql = "SELECT * FROM skew_info LIMIT 5"
            format = "table"
        }
    )
} | ConvertTo-Json -Depth 3

try {
    Write-Host "Testing PostgreSQL query..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$baseUrl/api/query" -Method Post -Headers $headers -Body $body
    Write-Host "✅ Query successful!" -ForegroundColor Green
    Write-Host "Data:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Query failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}