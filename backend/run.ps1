# Run any manage.py command with the backend venv, no activation needed.
#   .\run.ps1                    -> runserver
#   .\run.ps1 migrate
#   .\run.ps1 check_mongodb
$python = Join-Path $PSScriptRoot 'venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
    Write-Host 'Creating the virtual environment (first run only)...'
    python -m venv (Join-Path $PSScriptRoot 'venv')
    & $python -m pip install -r (Join-Path $PSScriptRoot '..\requirements.txt')
}
if ($args.Count -eq 0) { $args = @('runserver') }
& $python (Join-Path $PSScriptRoot 'manage.py') @args
