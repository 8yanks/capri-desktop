$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'Installing the pinned npm dependencies in this folder. No local AI model is included.'
& npm ci
if($LASTEXITCODE -ne 0){throw 'npm ci failed'}
& node node_modules/electron/install.js
if($LASTEXITCODE -ne 0){throw 'Electron runtime setup failed'}
& npm run doctor
if($LASTEXITCODE -ne 0){throw 'Doctor found a missing prerequisite'}
Write-Host 'Sign in to Codex or Claude on this machine, then run Start-Capri.cmd.'
