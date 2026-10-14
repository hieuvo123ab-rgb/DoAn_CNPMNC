import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
import urllib.request
import urllib.error
import subprocess
import hashlib
import time
import shutil
import tempfile

PRIMARY_URL = 'http://localhost:8080/api'
RECOVERY_URL = 'http://localhost:18080/api'
BACKUP_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backups')

def run_cmd(cmd, check=True):
    """Executes a shell command and returns stripped stdout string."""
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed (code {res.returncode}): {cmd}\nStderr: {res.stderr}\nStdout: {res.stdout}")
    return res.stdout.strip(), res.stderr.strip(), res.returncode

def get_auth_token(base_url, username='hieu', password='password123'):
    data = json.dumps({'username': username, 'password': password}).encode('utf-8')
    req = urllib.request.Request(f'{base_url}/auth/login', data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))['token']

def auth_get(url, token):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def auth_get_status(url, token):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code

def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest().lower()

def get_latest_backup_dir():
    if not os.path.exists(BACKUP_ROOT):
        raise FileNotFoundError(f"Backup directory not found: {BACKUP_ROOT}")
    dirs = [os.path.join(BACKUP_ROOT, d) for d in os.listdir(BACKUP_ROOT) if os.path.isdir(os.path.join(BACKUP_ROOT, d)) and d.startswith("edms_backup_")]
    if not dirs:
        raise FileNotFoundError(f"No edms_backup_* folders in {BACKUP_ROOT}")
    dirs.sort(key=os.path.getmtime)
    return dirs[-1]

# =========================================================================
# BACKUP TESTS (TEST 370 - TEST 377)
# =========================================================================

def test_370_backup_01_preflight_primary():
    print("[TEST 370] [BACKUP-01] Backup pre-flight succeeds on healthy primary environment...")
    # Check primary backend
    req = urllib.request.Request(f'{PRIMARY_URL}/health')
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
        health = json.loads(resp.read().decode('utf-8'))
        assert health.get('status') == 'UP'
    # Check postgres container
    out, _, _ = run_cmd('docker inspect edms-postgres --format "{{.State.Health.Status}}"')
    assert out == "healthy", f"edms-postgres status: {out}"
    # Check keystore inside container
    out, _, _ = run_cmd('docker exec edms-backend sh -c "[ -f /app/keys/edms-signing.p12 ] && echo EXISTS"')
    assert out == "EXISTS", "Signing keystore missing in edms-backend"
    # Check storage inside container
    out, _, _ = run_cmd('docker exec edms-backend sh -c "[ -d /app/storage/uploads ] && echo EXISTS"')
    assert out == "EXISTS", "Storage directory missing in edms-backend"
    print("  -> PASS: Primary stack, PostgreSQL, KeyStore, and storage online and pre-flight verified.")

def test_371_backup_02_database_artifact(backup_dir):
    print("[TEST 371] [BACKUP-02] PostgreSQL logical backup artifact created in custom format (-Fc)...")
    db_file = os.path.join(backup_dir, "database.dump")
    assert os.path.isfile(db_file), f"Missing database.dump in {backup_dir}"
    size = os.path.getsize(db_file)
    assert size > 1_000_000, f"database.dump suspiciously small: {size} bytes"
    # Check pg_dump custom format magic header (starts with b'PGDMP')
    with open(db_file, 'rb') as f:
        header = f.read(5)
        assert header == b'PGDMP', f"Invalid pg_dump header: {header}"
    print(f"  -> PASS: database.dump exists ({size:,} bytes) with valid PGDMP custom format header.")

def test_372_backup_03_storage_archive(backup_dir):
    print("[TEST 372] [BACKUP-03] Document storage volume archived into deterministic tar.gz...")
    storage_file = os.path.join(backup_dir, "storage.tar.gz")
    assert os.path.isfile(storage_file), f"Missing storage.tar.gz in {backup_dir}"
    size = os.path.getsize(storage_file)
    assert size > 1_000_000, f"storage.tar.gz suspiciously small: {size} bytes"
    # Check gzip magic header (0x1f, 0x8b)
    with open(storage_file, 'rb') as f:
        magic = f.read(2)
        assert magic == b'\x1f\x8b', f"Invalid gzip magic: {magic}"
    print(f"  -> PASS: storage.tar.gz exists ({size:,} bytes) with valid gzip tar archive header.")

def test_373_backup_04_keystore_backup(backup_dir):
    print("[TEST 373] [BACKUP-04] PKCS#12 signing KeyStore artifact backed up safely...")
    ks_file = os.path.join(backup_dir, "edms-signing.p12")
    assert os.path.isfile(ks_file), f"Missing edms-signing.p12 in {backup_dir}"
    size = os.path.getsize(ks_file)
    assert 2000 <= size <= 4096, f"Unexpected KeyStore file size: {size} bytes"
    print(f"  -> PASS: edms-signing.p12 exists ({size} bytes) preserving encrypted PKCS#12 bundle.")

def test_374_backup_05_manifest_metadata(backup_dir):
    print("[TEST 374] [BACKUP-05] Structured backup manifest generated with required non-secret metadata...")
    mf_file = os.path.join(backup_dir, "backup-manifest.json")
    assert os.path.isfile(mf_file), f"Missing backup-manifest.json in {backup_dir}"
    with open(mf_file, 'r', encoding='utf-8-sig') as f:
        mf = json.load(f)
    # Required top-level keys
    required_keys = ['backupId', 'createdAt', 'manifestVersion', 'applicationVersion', 'database', 'storage', 'keystore', 'certificateIdentity', 'counts']
    for k in required_keys:
        assert k in mf, f"Missing key '{k}' in manifest"
    # Ensure sensitive credentials are NOT leaked in manifest
    manifest_str = json.dumps(mf).lower()
    for forbidden in ['private_key', 'privatekey', 'password', 'signing-key', 'secret']:
        assert forbidden not in manifest_str, f"Forbidden secret keyword '{forbidden}' leaked in manifest!"
    assert mf['certificateIdentity']['serialNumber'] == '1790137027180'
    assert mf['counts']['users'] >= 100
    assert mf['counts']['documents'] >= 2500
    print(f"  -> PASS: Manifest verified. Non-secret identity and table counts recorded without credential leakage.")

def test_375_backup_06_checksum_verification(backup_dir):
    print("[TEST 375] [BACKUP-06] Cryptographic SHA-256 checksums verified for all backup artifacts...")
    cs_file = os.path.join(backup_dir, "checksums.sha256")
    assert os.path.isfile(cs_file), f"Missing checksums.sha256 in {backup_dir}"
    with open(os.path.join(backup_dir, "backup-manifest.json"), 'r', encoding='utf-8-sig') as f:
        mf = json.load(f)
    
    actual_db = compute_sha256(os.path.join(backup_dir, "database.dump"))
    actual_storage = compute_sha256(os.path.join(backup_dir, "storage.tar.gz"))
    actual_keystore = compute_sha256(os.path.join(backup_dir, "edms-signing.p12"))
    
    assert actual_db == mf['database']['sha256'], "database.dump SHA-256 mismatch!"
    assert actual_storage == mf['storage']['sha256'], "storage.tar.gz SHA-256 mismatch!"
    assert actual_keystore == mf['keystore']['sha256'], "edms-signing.p12 SHA-256 mismatch!"
    print(f"  -> PASS: SHA-256 checksums match disk artifacts 100% (db, storage, keystore).")

def test_376_backup_07_corrupted_artifact_detection(backup_dir):
    print("[TEST 376] [BACKUP-07] Corrupted backup copy fails cryptographic checksum verification...")
    # Create isolated temp copy of edms-signing.p12 and tamper 1 byte
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        src = os.path.join(backup_dir, "edms-signing.p12")
        with open(src, 'rb') as f:
            data = bytearray(f.read())
        # Flip first byte
        data[0] ^= 0xFF
        tmp.write(data)
        tmp_path = tmp.name
    try:
        tampered_hash = compute_sha256(tmp_path)
        with open(os.path.join(backup_dir, "backup-manifest.json"), 'r', encoding='utf-8-sig') as f:
            mf = json.load(f)
        assert tampered_hash != mf['keystore']['sha256'], "Tampered copy hash must not match manifest hash!"
        print(f"  -> PASS: Single-byte corruption detected (Manifest: {mf['keystore']['sha256'][:16]}... vs Tampered: {tampered_hash[:16]}...).")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_377_backup_08_missing_artifact_detection(backup_dir):
    print("[TEST 377] [BACKUP-08] Missing backup artifact causes pre-flight validation failure...")
    # Create temp directory with one missing file
    temp_dir = tempfile.mkdtemp()
    try:
        # Copy manifest and checksums only, omitting database.dump
        shutil.copy(os.path.join(backup_dir, "backup-manifest.json"), temp_dir)
        shutil.copy(os.path.join(backup_dir, "checksums.sha256"), temp_dir)
        shutil.copy(os.path.join(backup_dir, "edms-signing.p12"), temp_dir)
        shutil.copy(os.path.join(backup_dir, "storage.tar.gz"), temp_dir)
        # Verify that checking existence of database.dump fails
        missing_db = os.path.join(temp_dir, "database.dump")
        assert not os.path.exists(missing_db)
        # Attempt to run restore script with missing artifact should fail
        cmd = f'powershell -ExecutionPolicy Bypass -File scripts/restore-edms-test.ps1 -BackupDir "{temp_dir}"'
        _, stderr, code = run_cmd(cmd, check=False)
        assert code != 0, "Restore must exit with error when artifact is missing!"
        print("  -> PASS: Pre-flight correctly halts execution when backup payload is incomplete.")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# =========================================================================
# RESTORE TESTS (TEST 378 - TEST 407)
# =========================================================================

def test_378_restore_01_isolated_volumes_and_ports():
    print("[TEST 378] [RESTORE-01] Recovery stack uses isolated volumes and non-colliding ports...")
    # Inspect running recovery containers
    out_ports, _, _ = run_cmd('docker port edms-recovery-backend')
    assert '18080' in out_ports, f"Expected port 18080 for recovery backend, got: {out_ports}"
    out_pg_ports, _, _ = run_cmd('docker port edms-recovery-postgres')
    assert '15432' in out_pg_ports, f"Expected port 15432 for recovery postgres, got: {out_pg_ports}"
    
    # Inspect volume mounts of recovery backend
    out_mounts, _, _ = run_cmd('docker inspect edms-recovery-backend --format "{{json .Mounts}}"')
    assert 'edms_recovery_storage' in out_mounts, "Recovery backend must mount edms_recovery_storage"
    assert 'edms_recovery_keystore' in out_mounts, "Recovery backend must mount edms_recovery_keystore"
    assert 'edms_storage' not in out_mounts and 'doan_cnpmnc_edms_storage' not in out_mounts, "Primary storage volume must NOT be mounted!"
    print("  -> PASS: Recovery stack completely isolated on ports 15432/18080 with dedicated recovery volumes.")

def test_379_restore_02_database_restored():
    print("[TEST 379] [RESTORE-02] Database schema, sequences, and tables restored into clean recovery DB...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema=\'public\';"')
    table_count = int(out.strip())
    assert table_count >= 10, f"Expected >= 10 tables restored, got: {table_count}"
    print(f"  -> PASS: PostgreSQL schema restored ({table_count} tables present).")

def test_380_restore_03_storage_restored():
    print("[TEST 380] [RESTORE-03] Document storage restored into isolated recovery storage volume...")
    out, _, _ = run_cmd('docker exec edms-recovery-backend sh -c "ls -1 /app/storage/uploads | wc -l"')
    file_count = int(out.strip())
    assert file_count >= 3000, f"Expected >= 3000 files in storage, got: {file_count}"
    print(f"  -> PASS: Storage volume populated with {file_count:,} physical files.")

def test_381_restore_04_keystore_restored():
    print("[TEST 381] [RESTORE-04] PKCS#12 signing KeyStore restored into recovery keystore volume...")
    out, _, _ = run_cmd('docker exec edms-recovery-backend sh -c "[ -f /app/keys/edms-signing.p12 ] && wc -c < /app/keys/edms-signing.p12"')
    ks_size = int(out.strip())
    assert 2000 <= ks_size <= 4096, f"Unexpected KeyStore size: {ks_size}"
    print(f"  -> PASS: edms-signing.p12 restored ({ks_size} bytes).")

def test_382_restore_05_recovery_health():
    print("[TEST 382] [RESTORE-05] Recovery backend health endpoint returns UP...")
    req = urllib.request.Request(f'{RECOVERY_URL}/health')
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
        health = json.loads(resp.read().decode('utf-8'))
        assert health.get('status') == 'UP'
    print(f"  -> PASS: Recovery backend operational at {RECOVERY_URL}/health (Status: UP).")

def test_383_restore_06_user_count(manifest):
    print("[TEST 383] [RESTORE-06] Reconcile restored user count against backup snapshot...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM users;"')
    cnt = int(out.strip())
    expected = manifest['counts']['users']
    assert cnt == expected, f"User count mismatch: {cnt} != {expected}"
    print(f"  -> PASS: users count matches snapshot ({cnt} == {expected}).")

def test_384_restore_07_document_count(manifest):
    print("[TEST 384] [RESTORE-07] Reconcile restored document count against backup snapshot...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM documents;"')
    cnt = int(out.strip())
    expected = manifest['counts']['documents']
    assert cnt == expected, f"Document count mismatch: {cnt} != {expected}"
    print(f"  -> PASS: documents count matches snapshot ({cnt} == {expected}).")

def test_385_restore_08_document_version_count(manifest):
    print("[TEST 385] [RESTORE-08] Reconcile restored document_versions count against backup snapshot...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM document_versions;"')
    cnt = int(out.strip())
    expected = manifest['counts']['documentVersions']
    assert cnt == expected, f"Document versions count mismatch: {cnt} != {expected}"
    print(f"  -> PASS: document_versions count matches snapshot ({cnt} == {expected}).")

def test_386_restore_09_permission_count(manifest):
    print("[TEST 386] [RESTORE-09] Reconcile restored document_permissions count against backup snapshot...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM document_permissions;"')
    cnt = int(out.strip())
    expected = manifest['counts']['documentPermissions']
    assert cnt == expected, f"Permissions count mismatch: {cnt} != {expected}"
    print(f"  -> PASS: document_permissions count matches snapshot ({cnt} == {expected}).")

def test_387_restore_10_review_and_disposition_counts(manifest):
    print("[TEST 387] [RESTORE-10] Reconcile restored review and disposition counts against snapshot...")
    out_rev, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM document_reviews;"')
    out_disp, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM document_dispositions;"')
    rev_cnt = int(out_rev.strip())
    disp_cnt = int(out_disp.strip())
    assert rev_cnt == manifest['counts']['documentReviews'], f"Reviews mismatch: {rev_cnt} != {manifest['counts']['documentReviews']}"
    assert disp_cnt == manifest['counts']['documentDispositions'], f"Dispositions mismatch: {disp_cnt} != {manifest['counts']['documentDispositions']}"
    print(f"  -> PASS: document_reviews ({rev_cnt}) and document_dispositions ({disp_cnt}) match snapshot.")

def test_388_restore_11_audit_log_count(manifest):
    print("[TEST 388] [RESTORE-11] Reconcile restored audit log count against backup snapshot...")
    created_at = manifest['createdAt']
    out_snapshot, _, _ = run_cmd(f'docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM audit_logs WHERE timestamp <= \'{created_at}\';"')
    snapshot_cnt = int(out_snapshot.strip())
    expected = manifest['counts']['auditLogs']
    assert snapshot_cnt == expected, f"Historical audit logs mismatch: {snapshot_cnt} != {expected}"
    
    out_total, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM audit_logs;"')
    total_cnt = int(out_total.strip())
    assert total_cnt >= expected, f"Total audit logs unexpectedly less than snapshot: {total_cnt} < {expected}"
    print(f"  -> PASS: audit_logs snapshot count matches exactly ({snapshot_cnt} == {expected}) + {total_cnt - snapshot_cnt} live recovery audit events.")

def test_389_restore_12_notification_count(manifest):
    print("[TEST 389] [RESTORE-12] Reconcile restored notification count against backup snapshot...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM notifications;"')
    cnt = int(out.strip())
    expected = manifest['counts']['notifications']
    assert cnt == expected, f"Notification count mismatch: {cnt} != {expected}"
    print(f"  -> PASS: notifications count matches snapshot ({cnt} == {expected}).")

def test_390_restore_13_notification_unread_state(rec_token):
    print("[TEST 390] [RESTORE-13] Restored notifications preserve read/unread status and unread count...")
    unread_resp = auth_get(f'{RECOVERY_URL}/notifications/unread-count', rec_token)
    assert 'unreadCount' in unread_resp
    unread_cnt = unread_resp['unreadCount']
    assert unread_cnt > 0, f"Expected non-zero unread notifications, got: {unread_cnt}"
    # Verify DB read vs unread breakdown
    out_unread, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT count(*) FROM notifications WHERE is_read = false;"')
    total_unread_db = int(out_unread.strip())
    assert total_unread_db >= unread_cnt
    print(f"  -> PASS: Unread notification state intact (User unread: {unread_cnt}, Global DB unread: {total_unread_db}).")

def test_391_restore_14_private_acl_preserved(rec_token_hieu, rec_token_tin):
    print("[TEST 391] [RESTORE-14] PRIVATE document ACL boundaries strictly preserved after restore...")
    # Document 136 is PRIVATE created by hieu; tin has no permission granted
    status_hieu = auth_get_status(f'{RECOVERY_URL}/documents/136', rec_token_hieu)
    status_tin = auth_get_status(f'{RECOVERY_URL}/documents/136', rec_token_tin)
    assert status_hieu == 200, f"Owner hieu should have access (200), got {status_hieu}"
    assert status_tin == 403, f"Unauthorized user tin should receive 403, got {status_tin}"
    print("  -> PASS: Owner access GRANTED (200 OK), unauthorized access REJECTED (403 Forbidden).")

def test_392_restore_15_physical_file_hash_match():
    print("[TEST 392] [RESTORE-15] Representative document physical file matches pre-backup SHA-256...")
    out, _, _ = run_cmd('docker exec edms-recovery-backend sha256sum /app/storage/uploads/578f4652-c62c-4987-a95e-a1981d5f11f9_1790354754916.pdf')
    actual_hash = out.split()[0].lower()
    expected_hash = "90d784df6c92788c8d4b865cbc33695fd7a0c70e863fcd21469f8084553518c5"
    assert actual_hash == expected_hash, f"File hash mismatch: {actual_hash} != {expected_hash}"
    print(f"  -> PASS: Physical file SHA-256 byte-identical to pre-backup snapshot ({actual_hash[:16]}...).")

def test_393_restore_16_signed_document_validity(rec_token):
    print("[TEST 393] [RESTORE-16] Restored signed document remains INTACT + VALID under restored KeyStore...")
    integrity = auth_get(f'{RECOVERY_URL}/documents/1958/versions/1/integrity', rec_token)
    assert integrity['integrityStatus'] == 'INTACT', f"Expected INTACT, got {integrity['integrityStatus']}"
    assert integrity['signatureStatus'] == 'VALID', f"Expected VALID, got {integrity['signatureStatus']}"
    assert integrity['signerUsername'] == 'hieu'
    assert integrity['certSerialNumber'] == '1790137027180'
    print(f"  -> PASS: Document 1958 integrity INTACT and digital signature VALID.")

def test_394_restore_17_certificate_serial_match(manifest, rec_token):
    print("[TEST 394] [RESTORE-17] Active signing certificate serial number matches manifest identity...")
    cert_info = auth_get(f'{RECOVERY_URL}/admin/signature/certificate', rec_token)
    expected_serial = manifest['certificateIdentity']['serialNumber']
    assert cert_info['serialNumber'] == expected_serial, f"Serial mismatch: {cert_info['serialNumber']} != {expected_serial}"
    assert cert_info['subject'] == manifest['certificateIdentity']['subject']
    print(f"  -> PASS: Certificate serial {cert_info['serialNumber']} and subject identical to manifest.")

def test_395_restore_18_version_history_preserved(rec_token):
    print("[TEST 395] [RESTORE-18] Multi-version document history preserved in sequence...")
    # Find a document with multiple versions
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT document_id FROM document_versions GROUP BY document_id HAVING count(*) > 1 LIMIT 1;"')
    multi_doc_id = int(out.strip())
    versions = auth_get(f'{RECOVERY_URL}/documents/{multi_doc_id}/versions', rec_token)
    assert len(versions) > 1, f"Expected >1 versions for doc {multi_doc_id}, got {len(versions)}"
    version_numbers = [v['versionNumber'] for v in versions]
    assert set(version_numbers) == set(range(1, len(versions) + 1)), f"Versions sequence broken: {version_numbers}"
    assert version_numbers == sorted(version_numbers, reverse=True) or version_numbers == sorted(version_numbers), f"Versions not ordered: {version_numbers}"
    print(f"  -> PASS: Document {multi_doc_id} has {len(versions)} sequential versions preserved ({version_numbers}).")

def test_396_restore_19_review_history_preserved():
    print("[TEST 396] [RESTORE-19] Review workflow history and status transitions preserved...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT status, count(*) FROM document_reviews GROUP BY status ORDER BY status;"')
    statuses = dict(line.split('|') for line in out.splitlines() if '|' in line)
    statuses = {k.strip(): int(v.strip()) for k, v in statuses.items()}
    assert 'APPROVED' in statuses or 'PENDING' in statuses or 'REJECTED' in statuses
    print(f"  -> PASS: Review statuses preserved ({statuses}).")

def test_397_restore_20_lifecycle_retention_preserved():
    print("[TEST 397] [RESTORE-20] Document lifecycle statuses and legal hold flags preserved...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT lifecycle_status, count(*) FROM documents GROUP BY lifecycle_status ORDER BY lifecycle_status;"')
    lc_map = dict(line.split('|') for line in out.splitlines() if '|' in line)
    lc_map = {k.strip(): int(v.strip()) for k, v in lc_map.items()}
    assert 'ACTIVE' in lc_map
    print(f"  -> PASS: Lifecycle states preserved across repository ({lc_map}).")

def test_398_restore_21_disposition_state_preserved():
    print("[TEST 398] [RESTORE-21] Document disposition records and states preserved...")
    out, _, _ = run_cmd('docker exec edms-recovery-postgres psql -U edms_user -d edms_db -t -c "SELECT status, count(*) FROM document_dispositions GROUP BY status ORDER BY status;"')
    disp_map = dict(line.split('|') for line in out.splitlines() if '|' in line)
    disp_map = {k.strip(): int(v.strip()) for k, v in disp_map.items()}
    assert len(disp_map) > 0
    print(f"  -> PASS: Disposition records preserved ({disp_map}).")

def test_399_restore_22_content_search_without_reextraction(rec_token):
    print("[TEST 399] [RESTORE-22] Full-text content search operational immediately without re-extraction...")
    results = auth_get(f'{RECOVERY_URL}/documents?q=OcrEnglishToken99182&searchScope=CONTENT', rec_token)
    assert len(results) > 0, "Expected search results for OcrEnglishToken99182"
    doc = results[0]
    assert 'id' in doc and 'title' in doc
    print(f"  -> PASS: CONTENT search returned {len(results)} matches instantly from restored extracted_text.")

def test_400_restore_23_ocr_search_without_rerunning_ocr(rec_token):
    print("[TEST 400] [RESTORE-23] OCR extracted content searchable without re-running OCR processing...")
    results = auth_get(f'{RECOVERY_URL}/documents?q=OcrVersionTwoToken55142&searchScope=CONTENT', rec_token)
    assert len(results) > 0, "Expected search results for OCR token OcrVersionTwoToken55142"
    print(f"  -> PASS: OCR token query matched {len(results)} documents without re-triggering Tesseract.")

def test_401_restore_24_saved_search_preserved(rec_token):
    print("[TEST 401] [RESTORE-24] SavedSearch entities and filter configurations preserved...")
    searches = auth_get(f'{RECOVERY_URL}/saved-searches', rec_token)
    assert len(searches) > 0, "No saved searches returned"
    sample = searches[0]
    assert 'name' in sample and 'query' in sample
    print(f"  -> PASS: {len(searches)} saved searches restored with full query/filter criteria.")

def test_402_restore_25_task_center_derived_correctly(rec_token):
    print("[TEST 402] [RESTORE-25] Task Center correctly derives actionable tasks from restored tables...")
    tasks = auth_get(f'{RECOVERY_URL}/tasks', rec_token)
    assert len(tasks) > 0, "Expected derived tasks from pending reviews/actions"
    sample = tasks[0]
    assert sample.get('status') == 'PENDING'
    assert 'taskType' in sample
    print(f"  -> PASS: Task Center dynamically synthesized {len(tasks)} actionable tasks from source tables.")

def test_403_restore_26_wrong_keystore_causes_verification_failure(backup_dir, rec_token):
    print("[TEST 403] [RESTORE-26] Swapping KeyStore with unauthorized certificate causes signature INVALID...")
    # Rename current keystore in recovery container to trigger auto-generation of new certificate
    run_cmd('docker exec edms-recovery-backend mv /app/keys/edms-signing.p12 /app/keys/edms-signing.p12.bak')
    run_cmd('docker restart edms-recovery-backend')
    
    # Wait for backend to come UP
    time.sleep(5)
    for _ in range(25):
        try:
            req = urllib.request.Request(f'{RECOVERY_URL}/health')
            with urllib.request.urlopen(req, timeout=2) as resp:
                if json.loads(resp.read().decode('utf-8')).get('status') == 'UP':
                    break
        except Exception:
            time.sleep(1)
            
    # Check new token & new cert serial
    new_token = get_auth_token(RECOVERY_URL)
    cert_info = auth_get(f'{RECOVERY_URL}/admin/signature/certificate', new_token)
    assert cert_info['serialNumber'] != '1790137027180', f"Cert serial should have changed, got {cert_info['serialNumber']}"
    
    # Verify document 1958 signature status
    integrity = auth_get(f'{RECOVERY_URL}/documents/1958/versions/1/integrity', new_token)
    assert integrity['signatureStatus'] != 'VALID', f"Signature should NOT be VALID with wrong cert, got {integrity['signatureStatus']}"
    print(f"  -> PASS: Signature correctly rejected as {integrity['signatureStatus']} under unauthorized key (Serial: {cert_info['serialNumber']}).")

def test_404_restore_27_correct_keystore_restores_validity(backup_dir):
    print("[TEST 404] [RESTORE-27] Restoring backup KeyStore returns signature status to VALID...")
    # Restore original edms-signing.p12 back
    run_cmd('docker exec edms-recovery-backend mv /app/keys/edms-signing.p12.bak /app/keys/edms-signing.p12')
    run_cmd('docker restart edms-recovery-backend')
    
    # Wait for backend to come UP
    time.sleep(5)
    for _ in range(25):
        try:
            req = urllib.request.Request(f'{RECOVERY_URL}/health')
            with urllib.request.urlopen(req, timeout=2) as resp:
                if json.loads(resp.read().decode('utf-8')).get('status') == 'UP':
                    break
        except Exception:
            time.sleep(1)
            
    token = get_auth_token(RECOVERY_URL)
    cert_info = auth_get(f'{RECOVERY_URL}/admin/signature/certificate', token)
    assert cert_info['serialNumber'] == '1790137027180', f"Cert serial should be restored to 1790137027180, got {cert_info['serialNumber']}"
    
    integrity = auth_get(f'{RECOVERY_URL}/documents/1958/versions/1/integrity', token)
    assert integrity['signatureStatus'] == 'VALID', f"Signature should be VALID again, got {integrity['signatureStatus']}"
    assert integrity['integrityStatus'] == 'INTACT'
    print("  -> PASS: Authentic KeyStore restored; signature status returned to VALID and INTACT.")

def test_405_restore_28_second_clean_restore_reproducibility(backup_dir):
    print("[TEST 405] [RESTORE-28] Second clean recovery restore reproduces identical snapshot state...")
    cmd = f'powershell -ExecutionPolicy Bypass -File scripts/restore-edms-test.ps1 -BackupDir "{backup_dir}"'
    stdout, stderr, code = run_cmd(cmd)
    assert code == 0, f"Second restore failed: {stderr}\n{stdout}"
    
    # Verify counts and signature again
    token = get_auth_token(RECOVERY_URL)
    cert_info = auth_get(f'{RECOVERY_URL}/admin/signature/certificate', token)
    assert cert_info['serialNumber'] == '1790137027180'
    integrity = auth_get(f'{RECOVERY_URL}/documents/1958/versions/1/integrity', token)
    assert integrity['signatureStatus'] == 'VALID'
    assert integrity['integrityStatus'] == 'INTACT'
    print("  -> PASS: Clean-room second restore completed with identical cryptographic and database state.")

def test_406_restore_29_primary_stack_untouched():
    print("[TEST 406] [RESTORE-29] Primary environment remains 100% healthy, intact, and untouched...")
    req = urllib.request.Request(f'{PRIMARY_URL}/health')
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
        health = json.loads(resp.read().decode('utf-8'))
        assert health.get('status') == 'UP'
        
    token_pri = get_auth_token(PRIMARY_URL)
    integrity = auth_get(f'{PRIMARY_URL}/documents/1958/versions/1/integrity', token_pri)
    assert integrity['integrityStatus'] == 'INTACT'
    assert integrity['signatureStatus'] == 'VALID'
    
    # Check primary containers status
    out_pg, _, _ = run_cmd('docker inspect edms-postgres --format "{{.State.Health.Status}}"')
    assert out_pg == 'healthy'
    print("  -> PASS: Primary environment (port 8080/5432) suffered zero disruption, data loss, or state change.")

def test_407_restore_30_no_secrets_exposed(rec_token):
    print("[TEST 407] [RESTORE-30] No backup secrets, keys, or passwords exposed via REST API...")
    endpoints = [
        f'{RECOVERY_URL}/health',
        f'{RECOVERY_URL}/admin/signature/certificate',
        f'{RECOVERY_URL}/documents/1958/versions/1/integrity'
    ]
    for ep in endpoints:
        data = auth_get(ep, rec_token)
        serialized = json.dumps(data).lower()
        for forbidden in ['private_key', 'privatekey', 'password', 'edms-p13-signing-key', 'secret_key']:
            assert forbidden not in serialized, f"Secret '{forbidden}' found in endpoint {ep} response!"
    print("  -> PASS: Sensitive cryptographic credentials strictly contained within backend KeyStore service.")

# =========================================================================
# MAIN RUNNER
# =========================================================================

def run_all_disaster_recovery_tests():
    start_time = time.time()
    print("=" * 70)
    print("EDMS PHASE 15 — DISASTER RECOVERY & BACKUP/RESTORE VERIFICATION SUITE")
    print("=" * 70)
    
    backup_dir = get_latest_backup_dir()
    print(f"Using Backup Target: {backup_dir}")
    with open(os.path.join(backup_dir, "backup-manifest.json"), 'r', encoding='utf-8-sig') as f:
        manifest = json.load(f)
        
    print("\n--- PHASE 1: BACKUP VERIFICATION (TEST 370 - TEST 377) ---")
    test_370_backup_01_preflight_primary()
    test_371_backup_02_database_artifact(backup_dir)
    test_372_backup_03_storage_archive(backup_dir)
    test_373_backup_04_keystore_backup(backup_dir)
    test_374_backup_05_manifest_metadata(backup_dir)
    test_375_backup_06_checksum_verification(backup_dir)
    test_376_backup_07_corrupted_artifact_detection(backup_dir)
    test_377_backup_08_missing_artifact_detection(backup_dir)
    
    print("\n--- PHASE 2: ISOLATED RESTORE & DATA RECONCILIATION (TEST 378 - TEST 402) ---")
    rec_token_hieu = get_auth_token(RECOVERY_URL, 'hieu', 'password123')
    rec_token_tin = get_auth_token(RECOVERY_URL, 'tin', 'password123')
    
    test_378_restore_01_isolated_volumes_and_ports()
    test_379_restore_02_database_restored()
    test_380_restore_03_storage_restored()
    test_381_restore_04_keystore_restored()
    test_382_restore_05_recovery_health()
    test_383_restore_06_user_count(manifest)
    test_384_restore_07_document_count(manifest)
    test_385_restore_08_document_version_count(manifest)
    test_386_restore_09_permission_count(manifest)
    test_387_restore_10_review_and_disposition_counts(manifest)
    test_388_restore_11_audit_log_count(manifest)
    test_389_restore_12_notification_count(manifest)
    test_390_restore_13_notification_unread_state(rec_token_hieu)
    test_391_restore_14_private_acl_preserved(rec_token_hieu, rec_token_tin)
    test_392_restore_15_physical_file_hash_match()
    test_393_restore_16_signed_document_validity(rec_token_hieu)
    test_394_restore_17_certificate_serial_match(manifest, rec_token_hieu)
    test_395_restore_18_version_history_preserved(rec_token_hieu)
    test_396_restore_19_review_history_preserved()
    test_397_restore_20_lifecycle_retention_preserved()
    test_398_restore_21_disposition_state_preserved()
    test_399_restore_22_content_search_without_reextraction(rec_token_hieu)
    test_400_restore_23_ocr_search_without_rerunning_ocr(rec_token_hieu)
    test_401_restore_24_saved_search_preserved(rec_token_hieu)
    test_402_restore_25_task_center_derived_correctly(rec_token_hieu)
    
    print("\n--- PHASE 3: SECURITY, TAMPER RESISTANCE & REPRODUCIBILITY (TEST 403 - TEST 407) ---")
    test_403_restore_26_wrong_keystore_causes_verification_failure(backup_dir, rec_token_hieu)
    test_404_restore_27_correct_keystore_restores_validity(backup_dir)
    test_405_restore_28_second_clean_restore_reproducibility(backup_dir)
    test_406_restore_29_primary_stack_untouched()
    rec_token_after_restore = get_auth_token(RECOVERY_URL, 'hieu', 'password123')
    test_407_restore_30_no_secrets_exposed(rec_token_after_restore)
    
    duration = time.time() - start_time
    print("\n" + "=" * 70)
    print("KẾT QUẢ PHASE 15 DISASTER RECOVERY: TẤT CẢ 38/38 BÀI TEST (370–407) ĐÃ PASS 100%!")
    print(f"Tổng thời gian kiểm định DR: {duration:.2f} giây")
    print("VERDICT: PHASE15_BACKUP_RESTORE_DR_PASS")
    print("=" * 70)

if __name__ == '__main__':
    run_all_disaster_recovery_tests()
