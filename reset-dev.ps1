$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Resetting Crablearn Docker stack..."
docker compose down -v
Write-Host "Starting fresh stack..."
docker compose up --build
