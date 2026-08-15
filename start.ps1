# Launch backend and frontend dev servers in separate PowerShell windows.
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","Set-Location '$repoRoot'; npm run dev --workspace=backend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","Set-Location '$repoRoot'; npm run dev --workspace=frontend"
