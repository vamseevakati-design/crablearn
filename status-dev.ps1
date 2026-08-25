$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Crablearn Docker status:"
docker compose ps
