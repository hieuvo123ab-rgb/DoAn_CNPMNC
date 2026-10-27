# Generate server-only secrets on this Windows machine. Never copy this file to Git.
param(
    [string]$PublicOrigin = "https://edms.example.com"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$destination = Join-Path $root ".env.team-server"

if (Test-Path $destination) {
    throw ".env.team-server already exists. Refusing to overwrite secrets or disconnect the existing PostgreSQL/KeyStore."
}

$uri = $null
if (-not [Uri]::TryCreate($PublicOrigin, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne "https" -or $uri.AbsolutePath -ne "/") {
    throw "PublicOrigin must be an HTTPS origin such as https://edms.example.com (no path)"
}
$PublicOrigin = $uri.GetLeftPart([UriPartial]::Authority).TrimEnd('/')

function New-SecureSecret([int]$byteLength) {
    $bytes = New-Object byte[] $byteLength
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes)
}

$dbSecret = New-SecureSecret 24
$jwtSecret = New-SecureSecret 48
$keySecret = New-SecureSecret 24
$adminSecret = New-SecureSecret 24

$config = @"
EDMS_DB_PASSWORD=$dbSecret
EDMS_JWT_SECRET=$jwtSecret
EDMS_KEYSTORE_PASSWORD=$keySecret
EDMS_TEAM_ADMIN_USERNAME=team_admin
EDMS_TEAM_ADMIN_PASSWORD=$adminSecret
EDMS_PUBLIC_ORIGIN=$PublicOrigin
CLOUDFLARE_TUNNEL_TOKEN=
"@

[System.IO.File]::WriteAllText($destination, $config + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host "Created .env.team-server with independent random secrets." -ForegroundColor Green
Write-Host "INITIAL ADMIN USERNAME: team_admin"
Write-Host "INITIAL ADMIN PASSWORD: $adminSecret" -ForegroundColor Yellow
Write-Host "Keep this password private. It is also stored in the local, Git-ignored .env.team-server file."
Write-Host "Public origin: $PublicOrigin"
Write-Host ""
Write-Host "Local start: docker compose --env-file .env.team-server -f docker-compose.team-server.yml up -d --build"
Write-Host "For HTTPS remote access, create a Cloudflare Tunnel and set the real EDMS_PUBLIC_ORIGIN and CLOUDFLARE_TUNNEL_TOKEN in .env.team-server."
Write-Host "Then: docker compose --env-file .env.team-server -f docker-compose.team-server.yml --profile remote up -d"
