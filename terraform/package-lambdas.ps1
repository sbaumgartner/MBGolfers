# Package Lambda Functions for Deployment
# This script packages each Lambda function with its dependencies

Write-Host "Packaging Lambda functions..." -ForegroundColor Green

$lambdas = @("users", "playgroups", "sessions", "foursomes", "scores")

foreach ($lambda in $lambdas) {
    Write-Host "`nPackaging $lambda Lambda..." -ForegroundColor Cyan
    
    $lambdaDir = "..\lambda\$lambda"
    $zipFile = "$lambda.zip"
    
    # Remove old zip if it exists
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
        Write-Host "  Removed old $zipFile" -ForegroundColor Yellow
    }
    
    # Check if lambda directory exists
    if (-not (Test-Path $lambdaDir)) {
        Write-Host "  ERROR: Lambda directory not found: $lambdaDir" -ForegroundColor Red
        continue
    }
    
    # Install dependencies if package.json exists
    $packageJson = Join-Path $lambdaDir "package.json"
    if (Test-Path $packageJson) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        Push-Location $lambdaDir
        npm install --production 2>&1 | Out-Null
        Pop-Location
    }
    
    # Create zip file
    Write-Host "  Creating zip file..." -ForegroundColor Gray
    Push-Location $lambdaDir
    
    # Create zip using PowerShell
    $targetZip = "..\..\terraform\$zipFile"
    Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath $targetZip -Force
    
    Pop-Location
    
    if (Test-Path $zipFile) {
        Write-Host "  Created $zipFile" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Failed to create $zipFile" -ForegroundColor Red
    }
}

Write-Host "`nAll Lambda functions packaged successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'terraform apply' to deploy the updated Lambda functions" -ForegroundColor White
