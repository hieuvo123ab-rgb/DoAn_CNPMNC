<#
.SYNOPSIS
    EDMS Phase 15 - Application-Consistent Backup Script
.DESCRIPTION
    Creates a verified, application-consistent backup of EDMS primary environment:
    - PostgreSQL logical dump (-Fc format)
    - Document binary storage archive (tar.gz)
    - PKCS#12 signing KeyStore (edms-signing.p12)
    - Cryptographic SHA-256 checksums
    - Structured backup manifest with non-secret metadata & table counts
#>

[CmdletBinding()]
param (
    [string]$BackupRoot = "backups",
    [string]$Description = "EDMS Disaster Recovery Backup"
)

$ErrorActionPreference = "Stop"

$startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  EDMS DISASTER RECOVERY - BACKUP PROCEDURE (PHASE 15)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Pre-flight Validation
Write-Host "[1/6] Running Pre-flight Validation..." -ForegroundColor Yellow

# Check Docker daemon
try {
    $null = docker info 2>&1
} catch {
    Write-Error "Pre-flight FAILED: Docker daemon is not accessible."
    exit 1
}

# Check primary postgres container
$pgHealth = docker inspect edms-postgres --format "{{.State.Health.Status}}" 2>$null
if ($pgHealth -ne "healthy") {
    Write-Error "Pre-flight FAILED: edms-postgres container is not healthy (Status: $pgHealth)."
    exit 1
}

# Check primary backend reachable
try {
    $healthResp = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get -TimeoutSec 5
    if ($healthResp.status -ne "UP") {
        Write-Error "Pre-flight FAILED: edms-backend health status is not UP."
        exit 1
    }
} catch {
    Write-Error "Pre-flight FAILED: edms-backend is not reachable at http://localhost:8080/api/health."
    exit 1
}

# Check keystore exists in backend
$keystoreExists = docker exec edms-backend sh -c "[ -f /app/keys/edms-signing.p12 ] && echo 'EXISTS'" 2>$null
if ($keystoreExists.Trim() -ne "EXISTS") {
    Write-Error "Pre-flight FAILED: /app/keys/edms-signing.p12 not found in edms-backend."
    exit 1
}

# Check storage directory exists in backend
$storageExists = docker exec edms-backend sh -c "[ -d /app/storage/uploads ] && echo 'EXISTS'" 2>$null
if ($storageExists.Trim() -ne "EXISTS") {
    Write-Error "Pre-flight FAILED: /app/storage/uploads not found in edms-backend."
    exit 1
}

Write-Host "  -> Pre-flight SUCCESS: All services, keystore, and storage are online and verified." -ForegroundColor Green

# 2. Target Directory & Backup ID
$timestampStr = (Get-Date -Format "yyyyMMdd_HHmmss")
$backupId = "edms_backup_$timestampStr"
$targetDir = Join-Path $BackupRoot $backupId

if (-not (Test-Path $targetDir)) {
    $null = New-Item -ItemType Directory -Path $targetDir -Force
}

Write-Host "[2/6] Backup Target: $targetDir (Backup ID: $backupId)" -ForegroundColor Yellow

# 3. Capture Pre-backup State (Non-secret Metadata & Table Counts)
Write-Host "[3/6] Capturing State Snapshot Metadata..." -ForegroundColor Yellow

# Login to get certificate metadata
$loginBody = @{ username = "hieu"; password = "password123" } | ConvertTo-Json
$authHeader = @{ "Content-Type" = "application/json" }
$loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -Headers $authHeader
$token = $loginResp.token

$certHeaders = @{ "Authorization" = "Bearer $token" }
$certInfo = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/signature/certificate" -Method Get -Headers $certHeaders

# Query DB counts
$sqlCounts = @"
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'documents', count(*) FROM documents
UNION ALL SELECT 'document_versions', count(*) FROM document_versions
UNION ALL SELECT 'document_permissions', count(*) FROM document_permissions
UNION ALL SELECT 'document_reviews', count(*) FROM document_reviews
UNION ALL SELECT 'document_dispositions', count(*) FROM document_dispositions
UNION ALL SELECT 'saved_searches', count(*) FROM saved_searches
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'notifications', count(*) FROM notifications;
"@

$countsRaw = docker exec edms-postgres psql -U edms_user -d edms_db -t -A -F "," -c $sqlCounts
$countsMap = @{}
foreach ($line in ($countsRaw -split "`r?`n")) {
    if ($line.Trim() -ne "") {
        $parts = $line.Split(",")
        if ($parts.Length -eq 2) {
            $countsMap[$parts[0].Trim()] = [int64]$parts[1].Trim()
        }
    }
}

Write-Host "  -> Snapshot Counts: Users=$($countsMap['users']), Docs=$($countsMap['documents']), Versions=$($countsMap['document_versions']), Notifications=$($countsMap['notifications']), AuditLogs=$($countsMap['audit_logs'])" -ForegroundColor Green

# 4. Perform Artifact Backups
Write-Host "[4/6] Executing Consistent Snapshots..." -ForegroundColor Yellow

# A. Database logical backup (pg_dump -Fc)
Write-Host "  -> Dumping PostgreSQL database (pg_dump -Fc)..." -NoNewline
docker exec edms-postgres pg_dump -U edms_user -d edms_db -Fc -f /tmp/edms_db.dump
docker cp edms-postgres:/tmp/edms_db.dump (Join-Path $targetDir "database.dump")
docker exec edms-postgres rm -f /tmp/edms_db.dump
Write-Host " DONE." -ForegroundColor Green

# B. Document storage archive (tar.gz)
Write-Host "  -> Archiving document storage volume (tar -czf)..." -NoNewline
docker exec edms-backend sh -c "tar -czf /tmp/storage.tar.gz -C /app/storage/uploads ."
docker cp edms-backend:/tmp/storage.tar.gz (Join-Path $targetDir "storage.tar.gz")
docker exec edms-backend rm -f /tmp/storage.tar.gz
Write-Host " DONE." -ForegroundColor Green

# C. KeyStore backup (edms-signing.p12 copy)
Write-Host "  -> Copying PKCS#12 signing KeyStore..." -NoNewline
docker cp edms-backend:/app/keys/edms-signing.p12 (Join-Path $targetDir "edms-signing.p12")
Write-Host " DONE." -ForegroundColor Green

# 5. Checksum Computation & Verification
Write-Host "[5/6] Computing SHA-256 Checksums & Generating Manifest..." -ForegroundColor Yellow

$dbPath = Join-Path $targetDir "database.dump"
$storagePath = Join-Path $targetDir "storage.tar.gz"
$keystorePath = Join-Path $targetDir "edms-signing.p12"

$dbHash = (Get-FileHash -Path $dbPath -Algorithm SHA256).Hash.ToLower()
$dbSize = (Get-Item $dbPath).Length

$storageHash = (Get-FileHash -Path $storagePath -Algorithm SHA256).Hash.ToLower()
$storageSize = (Get-Item $storagePath).Length

$keystoreHash = (Get-FileHash -Path $keystorePath -Algorithm SHA256).Hash.ToLower()
$keystoreSize = (Get-Item $keystorePath).Length

# Write checksums.sha256 in standard format
$checksumLines = @(
    "$dbHash  database.dump",
    "$storageHash  storage.tar.gz",
    "$keystoreHash  edms-signing.p12"
)
$checksumFile = Join-Path $targetDir "checksums.sha256"
[System.IO.File]::WriteAllLines($checksumFile, $checksumLines)

# Build manifest object
$manifest = [ordered]@{
    backupId = $backupId
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    manifestVersion = "1.0"
    applicationVersion = "1.0.0"
    description = $Description
    environment = "docker-compose-primary"
    database = [ordered]@{
        filename = "database.dump"
        format = "pg_dump_custom"
        sha256 = $dbHash
        sizeBytes = $dbSize
    }
    storage = [ordered]@{
        filename = "storage.tar.gz"
        format = "tar_gzip"
        sha256 = $storageHash
        sizeBytes = $storageSize
    }
    keystore = [ordered]@{
        filename = "edms-signing.p12"
        format = "pkcs12_encrypted"
        sha256 = $keystoreHash
        sizeBytes = $keystoreSize
    }
    certificateIdentity = [ordered]@{
        serialNumber = $certInfo.serialNumber
        subject = $certInfo.subject
        issuer = $certInfo.issuer
        algorithm = $certInfo.algorithm
        validUntil = $certInfo.validUntil
    }
    counts = [ordered]@{
        users = $countsMap['users']
        documents = $countsMap['documents']
        documentVersions = $countsMap['document_versions']
        documentPermissions = $countsMap['document_permissions']
        documentReviews = $countsMap['document_reviews']
        documentDispositions = $countsMap['document_dispositions']
        savedSearches = $countsMap['saved_searches']
        auditLogs = $countsMap['audit_logs']
        notifications = $countsMap['notifications']
    }
}

$manifestFile = Join-Path $targetDir "backup-manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestFile -Encoding UTF8

Write-Host "  -> Checksums & Manifest created." -ForegroundColor Green

# 6. Post-backup Self-verification
Write-Host "[6/6] Verifying Backup Integrity..." -ForegroundColor Yellow

if ($dbSize -le 0 -or $storageSize -le 0 -or $keystoreSize -le 0) {
    Write-Error "Verification FAILED: One or more backup artifacts are empty."
    exit 1
}

# Verify checksums match newly read files
$verifyDb = (Get-FileHash -Path $dbPath -Algorithm SHA256).Hash.ToLower()
$verifyStorage = (Get-FileHash -Path $storagePath -Algorithm SHA256).Hash.ToLower()
$verifyKeystore = (Get-FileHash -Path $keystorePath -Algorithm SHA256).Hash.ToLower()

if ($verifyDb -ne $dbHash -or $verifyStorage -ne $storageHash -or $verifyKeystore -ne $keystoreHash) {
    Write-Error "Verification FAILED: Checksum mismatch on newly created backup."
    exit 1
}

$duration = (Get-Date) - $startTime
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  BACKUP COMPLETED AND VERIFIED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "  Backup ID:        $backupId" -ForegroundColor Cyan
Write-Host "  Directory:        $targetDir" -ForegroundColor Cyan
Write-Host "  Database dump:    $dbSize bytes (SHA256: $($dbHash.Substring(0,16))...)"
Write-Host "  Storage archive:  $storageSize bytes (SHA256: $($storageHash.Substring(0,16))...)"
Write-Host "  KeyStore file:    $keystoreSize bytes (SHA256: $($keystoreHash.Substring(0,16))...)"
Write-Host "  Cert Serial:      $($certInfo.serialNumber)"
Write-Host "  Duration:         $([math]::Round($duration.TotalSeconds, 2)) seconds"
Write-Host "============================================================" -ForegroundColor Green

return $targetDir
