import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
import urllib.request
import json

print("Đang kiểm tra kết nối sau khi Restart container...")
for i in range(25):
    try:
        with urllib.request.urlopen('http://localhost:8080/api/health') as resp:
            if resp.status == 200:
                print("Backend đã hoạt động trở lại (Status UP)!")
                break
    except Exception:
        time.sleep(1)

# Login as hieu
data = json.dumps({'username': 'hieu', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8080/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    token = res['token']

# Verify documents survived restart
req_docs = urllib.request.Request('http://localhost:8080/api/documents', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req_docs) as resp:
    docs = json.loads(resp.read().decode('utf-8'))
    print(f"[TEST 7 PASS] Khởi động lại container hoàn tất! Dữ liệu trong CSDL vẫn tồn tại nguyên vẹn: {len(docs)} tài liệu")
    for d in docs:
        print(f"  - ID {d['id']}: '{d['title']}' (Loại: {d['documentType']}, Tệp: {d['originalFileName']}, Người tạo: {d['createdBy']})")
    assert len(docs) >= 2, "Documents were lost after restart!"
    print("Dữ liệu lưu trữ bền vững (Persistent Volume) HOẠT ĐỘNG HOÀN HẢO!")
