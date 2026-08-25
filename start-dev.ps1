$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Starting Crablearn with Dockerized Postgres..."
docker compose up --build
