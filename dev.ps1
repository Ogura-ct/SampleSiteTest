# Cursor 統合ターミナルで npm が古い Node を使うときの回避用。
# 使い方: cd web  →  .\dev.ps1

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-NodeOk([string]$NodeExe) {
  if (-not (Test-Path $NodeExe)) { return $false }
  $v = & $NodeExe -p "process.versions.node"
  return [version]$v -ge [version]"18.0.0"
}

$candidates = New-Object System.Collections.Generic.List[string]
$candidates.Add((Join-Path $env:ProgramFiles "nodejs\node.exe"))
$pf86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
if ($pf86) {
  $candidates.Add((Join-Path $pf86 "nodejs\node.exe"))
}

$nodeExe = $null
foreach ($c in $candidates) {
  if (Test-NodeOk $c) { $nodeExe = $c; break }
}

if (-not $nodeExe) {
  $pathNode = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
  if ($pathNode -and (Test-NodeOk $pathNode)) { $nodeExe = $pathNode }
}

if (-not $nodeExe) {
  Write-Host "Node.js 18 以上が見つかりません。https://nodejs.org からインストールしてください。"
  exit 1
}

Write-Host "Using $nodeExe $( & $nodeExe -v )"
Push-Location $here
& $nodeExe .\scripts\run-dev.mjs @args
exit $LASTEXITCODE
