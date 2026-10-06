# Copies this kit into a project. Never overwrites existing files.
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 -Target C:\path\to\new-project
param([Parameter(Mandatory = $true)][string]$Target)

$kit = $PSScriptRoot
if (-not (Test-Path $Target)) { Write-Error "Target not found: $Target"; exit 1 }
$skip = @('install.ps1', 'README.md', 'CLAUDE.kit.md')

Get-ChildItem -Path $kit -Recurse -File -Force | ForEach-Object {
  $rel = $_.FullName.Substring($kit.Length + 1)
  if ($skip -contains $rel) { return }
  $dest = Join-Path $Target $rel
  if (Test-Path $dest) { Write-Host "skip (exists) $rel"; return }
  New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
  Copy-Item $_.FullName $dest
  Write-Host "added $rel"
}

# Point CLAUDE.md at the team docs.
$claude = Join-Path $Target 'CLAUDE.md'
$block = Get-Content (Join-Path $kit 'CLAUDE.kit.md') -Raw
if (-not (Test-Path $claude)) { Set-Content $claude $block -NoNewline; Write-Host 'added CLAUDE.md' }
elseif (-not (Select-String -Path $claude -Pattern '## Claude team' -Quiet)) { Add-Content $claude "`n$block"; Write-Host 'appended team section to CLAUDE.md' }

# Keep secrets and Figma downloads out of git.
$gi = Join-Path $Target '.gitignore'
foreach ($line in '.env', '.figma/', '.claude/settings.local.json') {
  if (-not ((Test-Path $gi) -and ((Get-Content $gi) -contains $line))) { Add-Content $gi $line }
}
Write-Host "`nDone. Next: fill .claude/team/PROJECT-PROFILE.md, put FIGMA_TOKEN/FIGMA_FILE_KEY in .env, then brief Claude."
