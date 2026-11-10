# tools/push-github.ps1 - cek kesiapan lalu push ke GitHub. TIDAK menyentuh Cloudflare.
#
#   powershell -File tools/push-github.ps1 -CheckOnly      # hanya periksa, tidak mengubah apa pun
#   powershell -File tools/push-github.ps1                 # build -> commit (bila ada perubahan) -> push
#   powershell -File tools/push-github.ps1 -Message "..."  # pesan commit sendiri
#   powershell -File tools/push-github.ps1 -SkipBuild      # lewati build (yakin aset sudah terbaru)
#
# Yang diperiksa sebelum push:
#   1. remote `origin` ada dan bisa dijangkau
#   2. berkas rahasia (.env, ADMIN_PASSWORD.txt, data/local.db) tidak ikut ter-track
#   3. build bersih: build.py -> assemble.py -> node --check dist/worker.js
#   4. baru setelah itu commit + push -u (upstream diset sekali)

[CmdletBinding()]
param(
  [string]$Message = "chore: perbarui situs",
  [switch]$SkipBuild,
  [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$fail = 0
function Ok($t) { Write-Host "  [ok]  $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [!]   $t" -ForegroundColor Yellow }
function Bad($t) { Write-Host "  [x]   $t" -ForegroundColor Red; $script:fail++ }

Write-Host "ELEMENTIA - pemeriksaan push GitHub" -ForegroundColor Cyan

# 1. remote
$remote = (git remote get-url origin 2>$null)
if ($remote) { Ok "remote origin: $remote" } else { Bad "remote 'origin' belum ada (git remote add origin <url>)" }

# 2. rahasia tidak boleh ter-track
$secretFiles = @('ADMIN_PASSWORD.txt', '.env', '.dev.vars', 'data/local.db')
$tracked = git ls-files -- $secretFiles 2>$null
if ($tracked) { Bad "berkas rahasia ter-track: $($tracked -join ', ') - keluarkan dengan 'git rm --cached <berkas>'" }
else { Ok "tidak ada berkas rahasia ter-track" }

$leaked = git grep -I -l -E "(CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{20,}|MIDTRANS_SERVER_KEY=[A-Za-z0-9_-]{10,}|FONNTE_TOKEN=[A-Za-z0-9]{10,})" -- . 2>$null
if ($leaked) { Bad "kemungkinan token nyasar di: $($leaked -join ', ')" } else { Ok "tidak ada token nyasar di berkas ter-track" }

# 3. status kerja
$branch = git rev-parse --abbrev-ref HEAD
Ok "cabang aktif: $branch"
$dirty = git status --porcelain
if ($dirty) { Warn "$(($dirty | Measure-Object).Count) perubahan belum di-commit" } else { Ok "tidak ada perubahan tertunda" }

if ($CheckOnly) {
  Write-Host ""
  if ($fail) { Write-Host "Ada $fail masalah - perbaiki dulu sebelum push." -ForegroundColor Red; exit 1 }
  Write-Host "Siap di-push. Jalankan tanpa -CheckOnly untuk build + commit + push." -ForegroundColor Green
  exit 0
}

# 4. build
if (-not $SkipBuild) {
  Write-Host "`nMembangun situs..." -ForegroundColor Cyan
  $pyCmd = "python"
  $pyResolved = (Get-Command python -ErrorAction SilentlyContinue).Source
  if (-not $pyResolved -or $pyResolved -match "WindowsApps") {
    $fallbackPy = Get-ChildItem -Path "$env:APPDATA\Accio\pre-install\*\python\python.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($fallbackPy) { $pyCmd = $fallbackPy }
  }
  & $pyCmd build.py
  if ($LASTEXITCODE -ne 0) { Bad "build.py gagal" }
  & $pyCmd assemble.py dist
  if ($LASTEXITCODE -ne 0) { Bad "assemble.py gagal" }
  node --check dist/worker.js
  if ($LASTEXITCODE -ne 0) { Bad "dist/worker.js tidak lolos node --check" }
  if (-not $fail) { Ok "build bersih (dist/worker.js + dist/public)" }
}

if ($fail) { Write-Host "`nPush dibatalkan: $fail masalah." -ForegroundColor Red; exit 1 }

# 5. commit bila perlu, lalu push (upstream diset sekali di sini)
git add -A
if (git diff --cached --quiet) {
  Ok "tidak ada perubahan untuk di-commit"
} else {
  git commit -q -m $Message
  Ok "commit dibuat: $(git log -1 --format='%h %s')"
}

Write-Host "`nMengirim ke GitHub..." -ForegroundColor Cyan
git push -u origin $branch
if ($LASTEXITCODE -ne 0) { Write-Host "Push gagal. Periksa kredensial GitHub (Personal Access Token) lalu ulangi." -ForegroundColor Red; exit 1 }
Write-Host "Selesai. CI berjalan bila tiga secret Cloudflare sudah diisi di repo." -ForegroundColor Green
