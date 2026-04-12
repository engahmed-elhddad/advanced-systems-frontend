# One-time migration (already applied): merged root `app/` + `lib/` into `src/`.
# Kept for reference; re-run only if restoring from an old tree.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$bak = Join-Path $root ".migration_backup_app"
if (Test-Path $bak) { Remove-Item -Recurse -Force $bak }
New-Item -ItemType Directory -Force -Path $bak | Out-Null

Write-Host "Backing up (admin), (public), admin_flat..."
if (Test-Path "src\app\(admin)") { Copy-Item "src\app\(admin)" (Join-Path $bak "(admin)") -Recurse -Force }
if (Test-Path "src\app\(public)") { Copy-Item "src\app\(public)" (Join-Path $bak "(public)") -Recurse -Force }
if (Test-Path "src\app\admin") { Copy-Item "src\app\admin" (Join-Path $bak "admin_flat") -Recurse -Force }

Write-Host "Copying root app -> src/app..."
Copy-Item "app\*" "src\app\" -Recurse -Force

Write-Host "Removing route groups (admin), (public)..."
if (Test-Path "src\app\(admin)") { Remove-Item -Recurse -Force "src\app\(admin)" }
if (Test-Path "src\app\(public)") { Remove-Item -Recurse -Force "src\app\(public)" }

Write-Host "Restoring rich admin from backup (admin)/admin..."
$adminBak = Join-Path $bak "(admin)\admin"
if (Test-Path $adminBak) {
  robocopy $adminBak "src\app\admin" /E /IS /IT /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

Write-Host "Re-applying root admin layout (AdminShell)..."
Copy-Item "app\admin\layout.tsx" "src\app\admin\layout.tsx" -Force

Write-Host "Merging admin_flat (products, rfqs)..."
$flatBak = Join-Path $bak "admin_flat"
if (Test-Path $flatBak) {
  robocopy $flatBak "src\app\admin" /E /IS /IT /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

Write-Host "Restoring account + login from (public) backup..."
$pub = Join-Path $bak "(public)"
if (Test-Path (Join-Path $pub "account")) {
  New-Item -ItemType Directory -Force -Path "src\app\account" | Out-Null
  Copy-Item (Join-Path $pub "account\*") "src\app\account\" -Recurse -Force
}
if (Test-Path (Join-Path $pub "login")) {
  Copy-Item (Join-Path $pub "login") "src\app\login" -Recurse -Force
}
if (Test-Path (Join-Path $pub "RFQModalGlobal.tsx")) {
  Copy-Item (Join-Path $pub "RFQModalGlobal.tsx") "src\app\RFQModalGlobal.tsx" -Force
}

Write-Host "Removing root app folder..."
Remove-Item -Recurse -Force "app"

Write-Host "Done app merge. Backup kept at $bak"
