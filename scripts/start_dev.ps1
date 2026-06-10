param(
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$EnvFile = Join-Path $Root ".env"

function Get-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$Name\s*=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    $value = ($line -replace "^\s*$Name\s*=", "").Trim()
    return $value.Trim('"').Trim("'")
}

function Invoke-Checked {
    param(
        [scriptblock]$Command,
        [string]$ErrorMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    $DatabaseUrl = Get-DotEnvValue -Path $EnvFile -Name "DATABASE_URL"
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    throw "DATABASE_URL is not set. Add it to .env or pass -DatabaseUrl."
}

Write-Host "Using database: $DatabaseUrl"

if (-not (Test-Path $Python)) {
    Write-Host "Creating Python venv for backend..."
    Push-Location $Backend
    Invoke-Checked { python -m venv .venv } "Failed to create backend virtual environment."
    Pop-Location
}

Write-Host "Checking backend pip and dependencies..."
Push-Location $Backend
& $Python -m pip --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Invoke-Checked { & $Python -m ensurepip --upgrade } "Failed to install pip in backend virtual environment."
}
Invoke-Checked { & $Python -m pip install -r requirements.txt } "Failed to install backend dependencies."
Pop-Location

Write-Host "Applying Alembic migrations..."
Push-Location $Backend
$env:DATABASE_URL = $DatabaseUrl
Invoke-Checked { & $Python -m alembic upgrade head } "Failed to apply Alembic migrations. Check DATABASE_URL and PostgreSQL credentials."
Pop-Location

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Write-Host "Installing frontend npm dependencies..."
    Push-Location $Frontend
    Invoke-Checked { npm install } "Failed to install frontend dependencies."
    Pop-Location
}

$backendCommand = @"
cd '$Backend'
`$env:DATABASE_URL='$DatabaseUrl'
& '$Python' -m uvicorn app.main:app --reload
"@

$frontendCommand = @"
cd '$Frontend'
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand

Write-Host ""
Write-Host "Startup complete."
Write-Host "Backend:  http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:4200"
