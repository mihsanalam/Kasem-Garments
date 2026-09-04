# setup-eas-secret.ps1
# Helper script to set up the GOOGLE_SERVICES_JSON environment variable in EAS
# Run this script after installing EAS CLI: npm install -g eas-cli

Write-Host "=== Setting up EAS Secret for google-services.json ===" -ForegroundColor Cyan
Write-Host ""

# Read the google-services.json file
$googleServicesPath = Join-Path $PSScriptRoot "..\google-services.json"

if (-not (Test-Path $googleServicesPath)) {
    Write-Host "ERROR: google-services.json not found at $googleServicesPath" -ForegroundColor Red
    exit 1
}

$content = Get-Content $googleServicesPath -Raw

Write-Host "Found google-services.json. Setting as EAS environment variable..." -ForegroundColor Yellow
Write-Host ""

# Set the environment variable in EAS
eas env:create --scope project --name GOOGLE_SERVICES_JSON --value $content --type string --visibility sensitive

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "The GOOGLE_SERVICES_JSON secret has been set in your EAS project."
Write-Host "It will be available during EAS Build to generate the google-services.json file."
