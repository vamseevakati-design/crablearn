$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Starting Crablearn stack..."
docker compose up --build
Start-Process 'http://localhost:5173'
