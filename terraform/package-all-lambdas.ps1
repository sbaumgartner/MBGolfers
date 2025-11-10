#!/usr/bin/env pwsh
# Package all Lambda functions for deployment

$ErrorActionPreference = "Stop"

$lambdas = @('users', 'playgroups', 'sessions', 'foursomes', 'scores')

Write-Host "`nPackaging Lambda functions..." -ForegroundColor Cyan

foreach ($lambda in $lambdas) {
    Write-Host "`nProcessing $lambda..." -ForegroundColor Yellow
    
    $lambdaDir = "..\lambda\$lambda"
    
    if (-not (Test-Path $lambdaDir)) {
        Write-Host "  ERROR: Directory not found: $lambdaDir" -ForegroundColor Red
        continue
    }
    
    Push-Location $lambdaDir
    
    Write-Host "  Creating zip file..."
    $zipFile = "..\..\terraform\$lambda.zip"
    
    # Remove old zip if exists
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
    
    # Create zip with all necessary files
    Compress-Archive -Path index.js,package.json,node_modules -DestinationPath $zipFile -Force
    
    if (Test-Path $zipFile) {
        $size = (Get-Item $zipFile).Length / 1KB
        $sizeRounded = [math]::Round($size, 2)
        Write-Host "  Created $lambda.zip ($sizeRounded KB)" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Failed to create $lambda.zip" -ForegroundColor Red
    }
    
    Pop-Location
}

Write-Host "`nAll Lambda functions packaged successfully!`n" -ForegroundColor Green

