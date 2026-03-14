# Wait for API to be ready script
param(
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutSeconds = 60,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

Write-Host "🔍 Waiting for API to be ready at $ApiUrl" -ForegroundColor Yellow
Write-Host "Timeout: $TimeoutSeconds seconds" -ForegroundColor Gray

$startTime = Get-Date
$attempt = 0

while ($true) {
    $attempt++
    $currentTime = Get-Date
    $elapsed = ($currentTime - $startTime).TotalSeconds
    
    if ($elapsed -gt $TimeoutSeconds) {
        Write-Host "❌ Timeout: API not ready after $TimeoutSeconds seconds" -ForegroundColor Red
        exit 1
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        
        if ($response -and $response.status -eq "healthy") {
            Write-Host "✅ API is ready! (attempt $attempt, ${elapsed}s)" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
            }
            exit 0
        } else {
            if ($Verbose) {
                Write-Host "⚠️ API responded but not healthy: $($response.status)" -ForegroundColor Yellow
            }
        }
    }
    catch {
        if ($Verbose) {
            Write-Host "⏳ Attempt $attempt failed: $($_.Exception.Message)" -ForegroundColor Gray
        } else {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    Start-Sleep -Seconds 1
}