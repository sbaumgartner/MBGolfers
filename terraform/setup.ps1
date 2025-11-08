# Golf Playgroups - Terraform Setup Script (PowerShell)
# This script creates placeholder Lambda ZIP files for initial Terraform deployment

Write-Host "=================================================="
Write-Host "Golf Playgroups - Terraform Setup"
Write-Host "=================================================="
Write-Host ""

# Check if we're in the terraform directory
if (-not (Test-Path "main.tf")) {
    Write-Host "Error: main.tf not found. Please run this script from the terraform directory." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating placeholder Lambda functions..."
Write-Host ""

# Function to create a placeholder Lambda
function Create-PlaceholderLambda {
    param (
        [string]$FunctionName
    )

    $TempDir = "temp_$FunctionName"

    Write-Host "  Creating $FunctionName.zip..."

    # Create temporary directory
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

    # Create placeholder index.js
    $IndexJs = @'
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    return {
        statusCode: 501,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'This Lambda function is not yet implemented',
            function: process.env.AWS_LAMBDA_FUNCTION_NAME
        })
    };
};
'@

    Set-Content -Path "$TempDir\index.js" -Value $IndexJs

    # Create placeholder package.json
    $PackageJson = @"
{
  "name": "$FunctionName",
  "version": "1.0.0",
  "description": "Golf Playgroups $FunctionName Lambda function",
  "main": "index.js",
  "dependencies": {}
}
"@

    Set-Content -Path "$TempDir\package.json" -Value $PackageJson

    # Create ZIP file
    $ZipPath = "$FunctionName.zip"
    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }

    # Compress files
    Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -Force

    # Clean up
    Remove-Item -Path $TempDir -Recurse -Force
}

# Create placeholder ZIPs for all Lambda functions
Create-PlaceholderLambda -FunctionName "users"
Create-PlaceholderLambda -FunctionName "playgroups"
Create-PlaceholderLambda -FunctionName "sessions"
Create-PlaceholderLambda -FunctionName "foursomes"
Create-PlaceholderLambda -FunctionName "scores"

Write-Host ""
Write-Host "Step 2: Initializing Terraform..."
Write-Host ""

terraform init

Write-Host ""
Write-Host "=================================================="
Write-Host "Setup Complete!"
Write-Host "=================================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review the Terraform plan:    terraform plan"
Write-Host "  2. Deploy the infrastructure:    terraform apply"
Write-Host "  3. View outputs after deploy:    terraform output"
Write-Host ""
Write-Host "Important: Save the outputs for your frontend configuration!"
Write-Host ""
