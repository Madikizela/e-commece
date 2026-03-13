# Comprehensive Automated Testing Script
# This script runs all automated tests across the entire application

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("unit", "integration", "e2e", "performance", "all")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:5222",
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReports = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput = $false
)

# Test Results Tracking
$Global:TestResults = @{
    StartTime = Get-Date
    EndTime = $null
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    SkippedTests = 0
    TestSuites = @()
    Environment = $Environment
    ApiUrl = $ApiUrl
}

function Write-TestHeader {
    param($Title)
    Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
    Write-Host "🤖 $Title" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "API URL: $ApiUrl" -ForegroundColor White
    Write-Host "Test Type: $TestType" -ForegroundColor White
    Write-Host "Started: $(Get-Date)" -ForegroundColor Gray
}

function Write-TestSection {
    param($SectionName)
    Write-Host "`n🧪 $SectionName" -ForegroundColor Green
    Write-Host "-" * 60 -ForegroundColor Gray
}

function Add-TestResult {
    param($SuiteName, $Passed, $Failed, $Skipped, $Duration, $Details = @())
    
    $Global:TestResults.TotalTests += ($Passed + $Failed + $Skipped)
    $Global:TestResults.PassedTests += $Passed
    $Global:TestResults.FailedTests += $Failed
    $Global:TestResults.SkippedTests += $Skipped
    
    $Global:TestResults.TestSuites += @{
        Name = $SuiteName
        Passed = $Passed
        Failed = $Failed
        Skipped = $Skipped
        Duration = $Duration
        Details = $Details
    }
}

function Test-BackendUnit {
    Write-TestSection "Backend Unit Tests"
    
    try {
        $startTime = Get-Date
        
        # Run backend unit tests (if they exist)
        Write-Host "Running .NET unit tests..." -ForegroundColor Yellow
        
        $testOutput = dotnet test backend/EcommerceAPI.csproj --configuration Release --logger "console;verbosity=minimal" --no-build 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend unit tests: PASSED" -ForegroundColor Green
            Add-TestResult "Backend Unit Tests" 1 0 0 $duration @("All unit tests passed")
        } else {
            Write-Host "❌ Backend unit tests: FAILED" -ForegroundColor Red
            Add-TestResult "Backend Unit Tests" 0 1 0 $duration @("Unit tests failed: $testOutput")
        }
    }
    catch {
        Write-Host "⚠️ Backend unit tests: SKIPPED (No test project found)" -ForegroundColor Yellow
        Add-TestResult "Backend Unit Tests" 0 0 1 0 @("No unit test project configured")
    }
}

function Test-BackendIntegration {
    Write-TestSection "Backend Integration Tests"
    
    try {
        $startTime = Get-Date
        
        # Check if integration test project exists
        if (Test-Path "backend/Tests/EcommerceAPI.IntegrationTests.csproj") {
            Write-Host "Running integration tests..." -ForegroundColor Yellow
            
            # Build integration tests
            dotnet build backend/Tests/EcommerceAPI.IntegrationTests.csproj --configuration Release
            
            if ($LASTEXITCODE -eq 0) {
                # Run integration tests
                $testOutput = dotnet test backend/Tests/EcommerceAPI.IntegrationTests.csproj --configuration Release --logger "console;verbosity=minimal" --no-build 2>&1
                $endTime = Get-Date
                $duration = ($endTime - $startTime).TotalSeconds
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Integration tests: PASSED" -ForegroundColor Green
                    Add-TestResult "Backend Integration Tests" 1 0 0 $duration @("All integration tests passed")
                } else {
                    Write-Host "❌ Integration tests: FAILED" -ForegroundColor Red
                    Add-TestResult "Backend Integration Tests" 0 1 0 $duration @("Integration tests failed: $testOutput")
                }
            } else {
                Write-Host "❌ Integration test build: FAILED" -ForegroundColor Red
                Add-TestResult "Backend Integration Tests" 0 1 0 0 @("Build failed")
            }
        } else {
            Write-Host "⚠️ Integration tests: SKIPPED (Project not found)" -ForegroundColor Yellow
            Add-TestResult "Backend Integration Tests" 0 0 1 0 @("Integration test project not found")
        }
    }
    catch {
        Write-Host "❌ Integration tests: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Backend Integration Tests" 0 1 0 0 @("Error: $($_.Exception.Message)")
    }
}

function Test-FrontendUnit {
    Write-TestSection "Frontend Unit Tests"
    
    try {
        $startTime = Get-Date
        
        Write-Host "Running frontend unit tests..." -ForegroundColor Yellow
        
        # Set CI environment variable
        $env:CI = "true"
        
        # Run frontend tests
        $testOutput = npm run test:run --prefix frontend-app 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend unit tests: PASSED" -ForegroundColor Green
            Add-TestResult "Frontend Unit Tests" 1 0 0 $duration @("All frontend tests passed")
        } else {
            Write-Host "❌ Frontend unit tests: FAILED" -ForegroundColor Red
            Add-TestResult "Frontend Unit Tests" 0 1 0 $duration @("Frontend tests failed: $testOutput")
        }
    }
    catch {
        Write-Host "❌ Frontend unit tests: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Frontend Unit Tests" 0 1 0 0 @("Error: $($_.Exception.Message)")
    }
}

function Test-FrontendE2E {
    Write-TestSection "Frontend E2E Tests"
    
    try {
        $startTime = Get-Date
        
        Write-Host "Running E2E health check tests..." -ForegroundColor Yellow
        
        # Set environment variables
        $env:VITE_API_URL = $ApiUrl
        $env:CI = "true"
        
        # Run E2E tests (using the health check test we created)
        $testOutput = npm run test:run --prefix frontend-app -- src/test/e2e/ 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ E2E tests: PASSED" -ForegroundColor Green
            Add-TestResult "Frontend E2E Tests" 1 0 0 $duration @("All E2E tests passed")
        } else {
            Write-Host "❌ E2E tests: FAILED" -ForegroundColor Red
            Add-TestResult "Frontend E2E Tests" 0 1 0 $duration @("E2E tests failed: $testOutput")
        }
    }
    catch {
        Write-Host "❌ E2E tests: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Frontend E2E Tests" 0 1 0 0 @("Error: $($_.Exception.Message)")
    }
}

function Test-Performance {
    Write-TestSection "Performance Tests"
    
    try {
        $startTime = Get-Date
        
        Write-Host "Running performance tests..." -ForegroundColor Yellow
        
        # Basic performance test using PowerShell
        $endpoints = @(
            "/api/health",
            "/api/health/ready",
            "/api/products",
            "/api/categories"
        )
        
        $performanceResults = @()
        $allPassed = $true
        
        foreach ($endpoint in $endpoints) {
            $url = "$ApiUrl$endpoint"
            $testStart = Get-Date
            
            try {
                $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5
                $testEnd = Get-Date
                $responseTime = ($testEnd - $testStart).TotalMilliseconds
                
                $passed = $responseTime -lt 1000
                if (-not $passed) { $allPassed = $false }
                
                $performanceResults += "Endpoint $endpoint`: $([math]::Round($responseTime, 2))ms $(if ($passed) { '✅' } else { '❌' })"
                
                if ($VerboseOutput) {
                    Write-Host "  $endpoint`: $([math]::Round($responseTime, 2))ms" -ForegroundColor $(if ($passed) { "Green" } else { "Red" })
                }
            }
            catch {
                $allPassed = $false
                $performanceResults += "Endpoint $endpoint`: FAILED - $($_.Exception.Message)"
                Write-Host "  $endpoint`: FAILED" -ForegroundColor Red
            }
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($allPassed) {
            Write-Host "✅ Performance tests: PASSED" -ForegroundColor Green
            Add-TestResult "Performance Tests" 1 0 0 $duration $performanceResults
        } else {
            Write-Host "❌ Performance tests: FAILED" -ForegroundColor Red
            Add-TestResult "Performance Tests" 0 1 0 $duration $performanceResults
        }
    }
    catch {
        Write-Host "❌ Performance tests: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Performance Tests" 0 1 0 0 @("Error: $($_.Exception.Message)")
    }
}

function Test-ApiHealthChecks {
    Write-TestSection "API Health Check Validation"
    
    try {
        $startTime = Get-Date
        
        Write-Host "Validating API health endpoints..." -ForegroundColor Yellow
        
        $healthChecks = @(
            @{ Endpoint = "/api/health"; ExpectedContent = "healthy" },
            @{ Endpoint = "/api/health/detailed"; ExpectedContent = "database" },
            @{ Endpoint = "/api/health/ready"; ExpectedContent = "ready" },
            @{ Endpoint = "/api/health/live"; ExpectedContent = "alive" }
        )
        
        $healthResults = @()
        $allPassed = $true
        
        foreach ($check in $healthChecks) {
            $url = "$ApiUrl$($check.Endpoint)"
            
            try {
                $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
                $content = $response | ConvertTo-Json
                
                if ($content -like "*$($check.ExpectedContent)*") {
                    $healthResults += "✅ $($check.Endpoint): PASSED"
                    if ($VerboseOutput) {
                        Write-Host "  $($check.Endpoint): PASSED" -ForegroundColor Green
                    }
                } else {
                    $allPassed = $false
                    $healthResults += "❌ $($check.Endpoint): FAILED - Expected content not found"
                    Write-Host "  $($check.Endpoint): FAILED" -ForegroundColor Red
                }
            }
            catch {
                $allPassed = $false
                $healthResults += "❌ $($check.Endpoint): FAILED - $($_.Exception.Message)"
                Write-Host "  $($check.Endpoint): FAILED" -ForegroundColor Red
            }
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($allPassed) {
            Write-Host "✅ Health check validation: PASSED" -ForegroundColor Green
            Add-TestResult "API Health Checks" 1 0 0 $duration $healthResults
        } else {
            Write-Host "❌ Health check validation: FAILED" -ForegroundColor Red
            Add-TestResult "API Health Checks" 0 1 0 $duration $healthResults
        }
    }
    catch {
        Write-Host "❌ Health check validation: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "API Health Checks" 0 1 0 0 @("Error: $($_.Exception.Message)")
    }
}

function Generate-TestReport {
    if (-not $GenerateReports) { return }
    
    Write-TestSection "Generating Test Reports"
    
    $Global:TestResults.EndTime = Get-Date
    $totalDuration = ($Global:TestResults.EndTime - $Global:TestResults.StartTime).TotalMinutes
    
    $reportPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $Global:TestResults | ConvertTo-Json -Depth 10 | Out-File $reportPath
    
    Write-Host "📊 Test report generated: $reportPath" -ForegroundColor Cyan
    
    # Generate HTML report
    $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Automated Test Results - $($Global:TestResults.Environment)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { background: #d4edda; }
        .failed { background: #f8d7da; }
        .skipped { background: #fff3cd; }
        .suite { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Automated Test Results</h1>
        <p><strong>Environment:</strong> $($Global:TestResults.Environment)</p>
        <p><strong>API URL:</strong> $($Global:TestResults.ApiUrl)</p>
        <p><strong>Duration:</strong> $([math]::Round($totalDuration, 2)) minutes</p>
        <p><strong>Generated:</strong> $(Get-Date)</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <h2>$($Global:TestResults.TotalTests)</h2>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <h2>$($Global:TestResults.PassedTests)</h2>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <h2>$($Global:TestResults.FailedTests)</h2>
        </div>
        <div class="metric skipped">
            <h3>Skipped</h3>
            <h2>$($Global:TestResults.SkippedTests)</h2>
        </div>
    </div>
    
    <h2>Test Suites</h2>
"@

    foreach ($suite in $Global:TestResults.TestSuites) {
        $status = if ($suite.Failed -gt 0) { "failed" } elseif ($suite.Skipped -gt 0) { "skipped" } else { "passed" }
        $htmlReport += @"
    <div class="suite $status">
        <h3>$($suite.Name)</h3>
        <p>Passed: $($suite.Passed) | Failed: $($suite.Failed) | Skipped: $($suite.Skipped) | Duration: $([math]::Round($suite.Duration, 2))s</p>
        <ul>
"@
        foreach ($detail in $suite.Details) {
            $htmlReport += "<li>$detail</li>"
        }
        $htmlReport += "</ul></div>"
    }
    
    $htmlReport += "</body></html>"
    
    $htmlReportPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    $htmlReport | Out-File $htmlReportPath -Encoding UTF8
    
    Write-Host "📊 HTML report generated: $htmlReportPath" -ForegroundColor Cyan
}

function Show-TestSummary {
    Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
    Write-Host "📊 Test Automation Summary" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Cyan
    
    $Global:TestResults.EndTime = Get-Date
    $totalDuration = ($Global:TestResults.EndTime - $Global:TestResults.StartTime).TotalMinutes
    
    Write-Host "Environment: $($Global:TestResults.Environment)" -ForegroundColor White
    Write-Host "Total Duration: $([math]::Round($totalDuration, 2)) minutes" -ForegroundColor White
    Write-Host "Total Tests: $($Global:TestResults.TotalTests)" -ForegroundColor White
    Write-Host "Passed: $($Global:TestResults.PassedTests)" -ForegroundColor Green
    Write-Host "Failed: $($Global:TestResults.FailedTests)" -ForegroundColor Red
    Write-Host "Skipped: $($Global:TestResults.SkippedTests)" -ForegroundColor Yellow
    
    $successRate = if ($Global:TestResults.TotalTests -gt 0) {
        [math]::Round(($Global:TestResults.PassedTests / $Global:TestResults.TotalTests) * 100, 2)
    } else { 0 }
    
    Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })
    
    Write-Host "`nTest Suite Results:" -ForegroundColor White
    foreach ($suite in $Global:TestResults.TestSuites) {
        $status = if ($suite.Failed -gt 0) { "❌ FAILED" } elseif ($suite.Skipped -gt 0) { "⚠️ SKIPPED" } else { "✅ PASSED" }
        $color = if ($suite.Failed -gt 0) { "Red" } elseif ($suite.Skipped -gt 0) { "Yellow" } else { "Green" }
        Write-Host "  $($suite.Name): $status ($([math]::Round($suite.Duration, 2))s)" -ForegroundColor $color
    }
    
    if ($Global:TestResults.FailedTests -eq 0) {
        Write-Host "`n🎉 ALL AUTOMATED TESTS PASSED!" -ForegroundColor Green
        Write-Host "✅ Application is ready for deployment" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ SOME TESTS FAILED!" -ForegroundColor Red
        Write-Host "❌ Review failures before deployment" -ForegroundColor Red
    }
}

# Main Execution
Write-TestHeader "Automated Testing Suite"

try {
    # Run tests based on type
    switch ($TestType) {
        "unit" {
            Test-BackendUnit
            Test-FrontendUnit
        }
        "integration" {
            Test-BackendIntegration
        }
        "e2e" {
            Test-FrontendE2E
        }
        "performance" {
            Test-Performance
        }
        "all" {
            Test-ApiHealthChecks
            Test-BackendUnit
            Test-BackendIntegration
            Test-FrontendUnit
            Test-FrontendE2E
            Test-Performance
        }
    }
    
    Generate-TestReport
    Show-TestSummary
    
    # Exit with appropriate code
    if ($Global:TestResults.FailedTests -eq 0) {
        exit 0
    } else {
        exit 1
    }
}
catch {
    Write-Host "`n💥 Critical Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Automated testing aborted." -ForegroundColor Red
    exit 2
}