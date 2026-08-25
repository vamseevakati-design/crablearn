$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "Checking Crablearn services..."

try {
    $api = Invoke-WebRequest -Uri 'http://localhost:4000/api/health' -UseBasicParsing -TimeoutSec 10
    Write-Host "API: OK -> $($api.Content)"
} catch {
    Write-Host "API: DOWN -> $($_.Exception.Message)"
}

try {
    $web = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 10
    Write-Host "Web: OK -> HTTP $($web.StatusCode)"
} catch {
    Write-Host "Web: DOWN -> $($_.Exception.Message)"
}

try {
    $pg = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    if ($pg) { Write-Host "Postgres: OK -> port 5432 reachable" } else { Write-Host "Postgres: DOWN -> port 5432 not reachable" }
} catch {
    Write-Host "Postgres: DOWN -> $($_.Exception.Message)"
}
