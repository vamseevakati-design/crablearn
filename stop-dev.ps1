$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Stopping Crablearn containers..."
docker compose down
