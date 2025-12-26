Write-Host "[TEST] API Key Testing Tool (PowerShell)" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3002"

try {
    # Step 1: Create API key
    Write-Host "[1] Creating a new API key..." -ForegroundColor Yellow
    
    $body = @{
        name = "Test API Key"
        role = "Admin"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/keys" -Method Post -Body $body -ContentType "application/json"
    $apiKey = $response.key
    
    Write-Host "[OK] API Key created: $apiKey" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Test the API key
    Write-Host "[2] Testing API key..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $apiKey"
    }
    
    $keysResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/keys" -Method Get -Headers $headers
    Write-Host "[OK] API Key works! Found $($keysResponse.Count) keys" -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Test health endpoint
    Write-Host "[3] Testing health endpoint..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "[OK] Health check: $($healthResponse.status)" -ForegroundColor Green
    Write-Host ""
    
    # Step 4: Test invalid key
    Write-Host "[4] Testing invalid API key..." -ForegroundColor Yellow
    try {
        $invalidHeaders = @{
            "Authorization" = "Bearer invalid_key"
        }
        Invoke-RestMethod -Uri "$baseUrl/api/auth/keys" -Method Get -Headers $invalidHeaders
        Write-Host "[FAIL] Invalid key test failed - should have been rejected" -ForegroundColor Red
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "[OK] Invalid key correctly rejected" -ForegroundColor Green
        }
        else {
            throw
        }
    }
    Write-Host ""
    
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[KEY] Your working API key: $apiKey" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[USAGE] Usage examples:" -ForegroundColor Yellow
    Write-Host "PowerShell:"
    Write-Host "`$headers = @{'Authorization' = 'Bearer $apiKey'}"
    Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/auth/keys' -Headers `$headers"
    Write-Host ""
    Write-Host "Curl:"
    Write-Host "curl -H `"Authorization: Bearer $apiKey`" $baseUrl/api/auth/keys"
    
    # Save API key to file
    $apiKey | Out-File -FilePath "api-key.txt" -Encoding UTF8
    Write-Host ""
    Write-Host "[SAVED] API key saved to api-key.txt" -ForegroundColor Green
    
}
catch {
    Write-Host "[ERROR] Test failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*refused*") {
        Write-Host ""
        Write-Host "[INFO] Make sure your server is running on port 3002" -ForegroundColor Yellow
        Write-Host "[INFO] Run: npm run dev (in the server directory)"
    }
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")