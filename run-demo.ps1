# API Deprecation Guard - oasdiff demo
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File demo\run-demo.ps1
$ErrorActionPreference = 'Continue'
$here = $PSScriptRoot
$oasdiff = if (Get-Command oasdiff -ErrorAction SilentlyContinue) { 'oasdiff' } else { "$HOME\go\bin\oasdiff.exe" }
Set-Location "$here\specs"

$scenarios = @(
  @{ file = '1-remove.yaml';    title = 'Scenario 1: delete phone + /orders with NO deprecation' },
  @{ file = '2-deprecate.yaml'; title = 'Scenario 2: deprecate /orders with sunset date (the right way)' },
  @{ file = '3-rename.yaml';    title = 'Scenario 3: rename phone -> phoneNumber' }
)

foreach ($s in $scenarios) {
  Write-Host "`n==================== $($s.title) ====================" -ForegroundColor Cyan

  Write-Host "`n[1] oasdiff breaking  (what CI would block)" -ForegroundColor Yellow
  & $oasdiff breaking base.yaml $s.file -o ERR
  $code = $LASTEXITCODE
  if ($code -eq 0) { Write-Host "    exit code 0 -> PR passes" -ForegroundColor Green }
  else             { Write-Host "    exit code $code -> PR FAILS" -ForegroundColor Red }

  Write-Host "`n[2] oasdiff changelog (every change, incl. non-breaking)" -ForegroundColor Yellow
  & $oasdiff changelog base.yaml $s.file

  Write-Host "[3] OUR PART: which consumer apps are affected?" -ForegroundColor Yellow
  node "$here\impact\impact.ts" base.yaml $s.file

  Read-Host "`nPress Enter for next scenario"
}

Write-Host "`n[bonus] raw JSON our TypeScript reads:" -ForegroundColor Yellow
& $oasdiff changelog base.yaml 1-remove.yaml -f json
