import requests
import datetime

BASE_URL = "http://localhost:8080/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return resp.json()["token"]

def main():
    token = login("hieu", "password123")
    headers = {"Authorization": f"Bearer {token}"}

    # Clean existing manual tasks if any
    existing = requests.get(f"{BASE_URL}/manual-tasks?size=100", headers=headers).json().get("content", [])
    for t in existing:
        requests.delete(f"{BASE_URL}/manual-tasks/{t['id']}", headers=headers)

    now = datetime.datetime.now(datetime.timezone.utc)

    tasks_to_create = [
        {
            "title": "Rà soát điều khoản hợp đồng đối tác chiến lược 2026",
            "description": "Kiểm tra kỹ các điều khoản về bảo mật thông tin, trách nhiệm pháp lý và phương thức giải quyết tranh chấp.",
            "assignee": "tin",
            "priority": "HIGH",
            "dueDate": (now + datetime.timedelta(days=2)).isoformat(),
            "notes": "Hồ sơ đính kèm đã được tải lên kho tài liệu nội bộ."
        },
        {
            "title": "Kiểm định định kỳ hồ sơ lưu trữ vượt quá 5 năm",
            "description": "Đối soát danh mục hồ sơ hết hạn lưu trữ để trình hội đồng tiêu hủy theo quy định ISO 15489.",
            "assignee": "tin",
            "priority": "URGENT",
            "dueDate": (now - datetime.timedelta(days=1)).isoformat(), # Overdue
            "notes": "Đã quá hạn 1 ngày, cần lập biên bản trình lãnh đạo."
        },
        {
            "title": "Cập nhật chữ ký số và xác thực chứng thư cho ban giám đốc",
            "description": "Cấu hình chứng thư số PKCS#12 chuẩn RSA-2048 vào kho bảo mật EDMS cho đợt ký kết quý 4.",
            "assignee": "hieu",
            "priority": "MEDIUM",
            "dueDate": (now + datetime.timedelta(days=5)).isoformat(),
            "notes": "Đã cấp phát token và kiểm tra hash SHA-256."
        },
        {
            "title": "Báo cáo phân tích hiệu suất trích xuất nội dung OCR và Semantic Search",
            "description": "Tổng hợp thời gian phản hồi của mô hình ONNX Multilingual E5 Small và độ trễ trích xuất PDF scan.",
            "assignee": "tin",
            "priority": "LOW",
            "dueDate": (now + datetime.timedelta(days=7)).isoformat(),
            "notes": "Sử dụng dữ liệu từ nhật ký kiểm toán."
        },
        {
            "title": "Kế hoạch sao lưu và khôi phục dữ liệu thảm họa (Disaster Recovery)",
            "description": "Hoàn tất kịch bản kiểm thử phục hồi dữ liệu từ bản sao lưu cold-backup định kỳ.",
            "assignee": "admin",
            "priority": "HIGH",
            "dueDate": (now - datetime.timedelta(days=3)).isoformat(), # Overdue
            "notes": "Đã tiến hành nghiệm thu thành công kịch bản phục hồi."
        }
    ]

    created_ids = []
    for item in tasks_to_create:
        res = requests.post(f"{BASE_URL}/manual-tasks", headers=headers, json=item)
        if res.status_code == 201:
            t = res.json()
            created_ids.append(t["id"])
            print(f"Created task #{t['id']}: {t['title']}")

    # Advance task 1 to IN_PROGRESS
    if len(created_ids) >= 1:
        tin_token = login("tin", "password123")
        tin_headers = {"Authorization": f"Bearer {tin_token}"}
        requests.patch(
            f"{BASE_URL}/manual-tasks/{created_ids[0]}/status",
            headers=tin_headers,
            json={"status": "IN_PROGRESS", "note": "Đã tiếp nhận hồ sơ và đang rà soát phụ lục 2"}
        )

    # Complete task 5 (DONE)
    if len(created_ids) >= 5:
        requests.patch(
            f"{BASE_URL}/manual-tasks/{created_ids[4]}/status",
            headers=headers,
            json={"status": "DONE", "note": "Đã hoàn thành diễn tập phục hồi DR và ký biên bản nghiệm thu"}
        )

    print("Demo tasks seeded successfully!")

if __name__ == "__main__":
    main()
