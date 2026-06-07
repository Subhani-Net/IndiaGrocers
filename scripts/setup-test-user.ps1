# BDD Test Setup — Creates test user account for automated tests
# Run: powershell -File scripts\setup-test-user.ps1
# Requires: Backend running on http://localhost:9000
# Prerequisite: npm install has been run at root

Write-Host "=== BDD Test Setup ===" -ForegroundColor Cyan
Write-Host "Creating test user: test-user@example.com / TestPass1" -ForegroundColor Yellow

Set-Location $PSScriptRoot\..\apps\backend

try {
    npx medusa user -e test-user@example.com -p TestPass1
    Write-Host "Test user ready." -ForegroundColor Green
} catch {
    Write-Host "Note: User may already exist — check backend logs." -ForegroundColor Yellow
}

Write-Host "Storefront credentials for BDD tests:" -ForegroundColor Cyan
Write-Host "  Email:    test-user@example.com"
Write-Host "  Password: TestPass1"
