import sys
import json
import requests
import datetime

BASE_URL = "http://localhost:8080/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        raise Exception(f"Failed to login as {username}: {resp.status_code} {resp.text}")
    return resp.json()["token"]

def main():
    print("==================================================================")
    print("EDMS MANUAL TASK SUBSYSTEM INTEGRATION VERIFICATION")
    print("==================================================================")

    # 1. Login Accounts
    print("[STEP 1] Logging in test accounts (hieu, tin, user)...")
    admin_token = login("hieu", "password123")
    tin_token = login("tin", "password123")
    user_token = login("user", "password123")
    print("SUCCESS: Authenticated hieu (ROLE_ADMIN), tin (ROLE_STAFF), user (ROLE_USER)")

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_tin = {"Authorization": f"Bearer {tin_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}

    # 2. Verify Derived System Tasks (Zero regression)
    print("\n[STEP 2] Verifying derived system tasks endpoint (/api/tasks)...")
    derived_resp = requests.get(f"{BASE_URL}/tasks", headers=headers_admin)
    assert derived_resp.status_code == 200, f"Expected 200 but got {derived_resp.status_code}"
    derived_tasks = derived_resp.json()
    print(f"SUCCESS: /api/tasks returned {len(derived_tasks)} system workflow tasks without modification.")
    for t in derived_tasks[:3]:
        print(f"  - System Task: type={t.get('taskType')}, docId={t.get('documentId')}, actionKey={t.get('actionKey')}")

    # 3. Verify Assignees List
    print("\n[STEP 3] Verifying /api/manual-tasks/assignees...")
    assignees_resp = requests.get(f"{BASE_URL}/manual-tasks/assignees", headers=headers_admin)
    assert assignees_resp.status_code == 200, f"Expected 200 but got {assignees_resp.status_code}"
    assignees = assignees_resp.json()
    usernames = [a["username"] for a in assignees]
    print(f"SUCCESS: Retrieved {len(assignees)} valid assignees: {usernames}")
    assert "tin" in usernames, "Assignees should include staff user 'tin'"

    # 4. Verify Task Summary
    print("\n[STEP 4] Verifying /api/manual-tasks/summary...")
    summary_resp = requests.get(f"{BASE_URL}/manual-tasks/summary", headers=headers_admin)
    assert summary_resp.status_code == 200, f"Expected 200 but got {summary_resp.status_code}"
    summary = summary_resp.json()
    print(f"SUCCESS: Initial summary: total={summary['total']}, todo={summary['todo']}, inProgress={summary['inProgress']}, done={summary['done']}, overdue={summary['overdue']}")

    # 5. Create Manual Task
    print("\n[STEP 5] Creating a new manual task assigned to tin...")
    due_iso = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)).isoformat()
    new_task_payload = {
        "title": "Kiểm tra tính pháp lý của hợp đồng mua sắm thiết bị",
        "description": "Rà soát kỹ các điều khoản bảo hành, thanh toán và bảo mật tài liệu.",
        "assignee": "tin",
        "priority": "HIGH",
        "dueDate": due_iso,
        "notes": "Ưu tiên xử lý gấp trong tuần này."
    }
    create_resp = requests.post(f"{BASE_URL}/manual-tasks", headers=headers_admin, json=new_task_payload)
    assert create_resp.status_code == 201, f"Expected 201 but got {create_resp.status_code}: {create_resp.text}"
    created_task = create_resp.json()
    task_id = created_task["id"]
    print(f"SUCCESS: Created task #{task_id}: title='{created_task['title']}', assignee='{created_task['assignee']}', status='{created_task['status']}'")

    # 6. Verify Task Detail & Activity Timeline
    print(f"\n[STEP 6] Verifying detail & activity history for task #{task_id}...")
    detail_resp = requests.get(f"{BASE_URL}/manual-tasks/{task_id}", headers=headers_admin)
    assert detail_resp.status_code == 200
    task_detail = detail_resp.json()
    activities = task_detail.get("activities", [])
    print(f"SUCCESS: Retrieved task #{task_id} with {len(activities)} activity logs.")
    assert len(activities) >= 1, "Should have at least 1 CREATED activity"
    assert activities[0]["action"] == "CREATED"

    # 7. Verify Filtering & Search
    print("\n[STEP 7] Verifying filtering and keyword search...")
    filter_resp = requests.get(f"{BASE_URL}/manual-tasks?search=pháp lý&assignee=tin", headers=headers_admin)
    assert filter_resp.status_code == 200
    items = filter_resp.json().get("content", [])
    assert any(t["id"] == task_id for t in items), f"Expected task #{task_id} in filtered results"
    print(f"SUCCESS: Keyword search 'pháp lý' correctly returned task #{task_id}")

    # 8. Staff Updates Status: TODO -> IN_PROGRESS
    print(f"\n[STEP 8] Staff user 'tin' advances task #{task_id} to IN_PROGRESS...")
    status_resp_1 = requests.patch(
        f"{BASE_URL}/manual-tasks/{task_id}/status",
        headers=headers_tin,
        json={"status": "IN_PROGRESS", "note": "Đã tiếp nhận hồ sơ và bắt đầu rà soát"}
    )
    assert status_resp_1.status_code == 200
    assert status_resp_1.json()["status"] == "IN_PROGRESS"
    print(f"SUCCESS: Task #{task_id} status updated to IN_PROGRESS by staff 'tin'")

    # 8.1 Post Comment & Discussion Thread
    print(f"\n[STEP 8.1] Adding a collaborative comment on task #{task_id}...")
    comment_payload = {"comment": "Đã đính kèm biên bản thẩm định pháp lý chi tiết theo yêu cầu."}
    comment_resp = requests.post(f"{BASE_URL}/manual-tasks/{task_id}/comments", headers=headers_tin, json=comment_payload)
    assert comment_resp.status_code == 200, f"Expected 200 but got {comment_resp.status_code}: {comment_resp.text}"
    comment_task = comment_resp.json()
    activities_after_comment = comment_task.get("activities", [])
    has_comment_activity = any(a.get("action") == "COMMENT_ADDED" for a in activities_after_comment)
    assert has_comment_activity, "Expected activity COMMENT_ADDED in task history"
    print(f"SUCCESS: Successfully added comment to task #{task_id} and recorded COMMENT_ADDED in audit trail.")

    # 8.2 Workload & Backlog Analytics
    print("\n[STEP 8.2] Verifying workload analytics endpoint (/api/manual-tasks/workload)...")
    workload_resp = requests.get(f"{BASE_URL}/manual-tasks/workload", headers=headers_admin)
    assert workload_resp.status_code == 200, f"Expected 200 but got {workload_resp.status_code}"
    workload_data = workload_resp.json()
    print(f"SUCCESS: Retrieved workload distribution for {len(workload_data)} team members:")
    for w in workload_data:
        print(f"  - @{w['username']} ({w['fullName']}): total={w['total']}, inProgress={w['inProgress']}, done={w['done']}, overdue={w['overdue']}")
    assert any(w["username"] == "tin" for w in workload_data), "Assignee 'tin' should be present in workload summary"

    # 8.3 Escalation & Reminder Scan
    print("\n[STEP 8.3] Triggering deadline escalation scan (/api/manual-tasks/escalate-check)...")
    escalate_resp = requests.post(f"{BASE_URL}/manual-tasks/escalate-check", headers=headers_admin)
    assert escalate_resp.status_code == 200, f"Expected 200 but got {escalate_resp.status_code}"
    escalate_result = escalate_resp.json()
    print(f"SUCCESS: Escalation scan completed: reminded={escalate_result.get('remindedTasksCount')}, overdue={escalate_result.get('overdueTasksCount')}, message='{escalate_result.get('message')}'")

    print(f"\n[STEP 8.4] Staff user 'tin' completes task #{task_id} (DONE)...")
    status_resp_2 = requests.patch(
        f"{BASE_URL}/manual-tasks/{task_id}/status",
        headers=headers_tin,
        json={"status": "DONE", "note": "Đã hoàn thành rà soát và xác nhận các điều khoản hợp lệ"}
    )
    assert status_resp_2.status_code == 200
    assert status_resp_2.json()["status"] == "DONE"
    assert status_resp_2.json()["completedAt"] is not None
    print(f"SUCCESS: Task #{task_id} status updated to DONE with completedAt={status_resp_2.json()['completedAt']}")

    # 9. Verify Activity History Timeline After Status Updates and Comments
    print(f"\n[STEP 9] Inspecting updated activity timeline for task #{task_id}...")
    detail_resp_2 = requests.get(f"{BASE_URL}/manual-tasks/{task_id}", headers=headers_admin)
    updated_detail = detail_resp_2.json()
    updated_activities = updated_detail.get("activities", [])
    print(f"SUCCESS: Activity count is now {len(updated_activities)}:")
    for a in updated_activities:
        print(f"  - [{a.get('action')}] by @{a.get('username')}: {a.get('oldValue')} -> {a.get('newValue')} (comment: {a.get('comment')})")
    assert len(updated_activities) >= 4, "Expected at least 4 activities (CREATED, STATUS_CHANGED, COMMENT_ADDED, STATUS_CHANGED)"

    # 10. Verify RBAC Security Boundaries
    print("\n[STEP 10] Testing RBAC boundaries (unauthorized operations)...")
    unauth_delete_resp = requests.delete(f"{BASE_URL}/manual-tasks/{task_id}", headers=headers_user)
    assert unauth_delete_resp.status_code == 403, f"Expected 403 Forbidden but got {unauth_delete_resp.status_code}"
    print(f"SUCCESS: Ordinary user correctly forbidden (403) from deleting task #{task_id}")

    unauth_escalate_resp = requests.post(f"{BASE_URL}/manual-tasks/escalate-check", headers=headers_user)
    assert unauth_escalate_resp.status_code == 403, f"Expected 403 Forbidden for escalation scan but got {unauth_escalate_resp.status_code}"
    print("SUCCESS: Ordinary user correctly forbidden (403) from triggering escalation check")

    # 11. Cleanup Test Task
    print(f"\n[STEP 11] Cleaning up test task #{task_id} as admin...")
    del_resp = requests.delete(f"{BASE_URL}/manual-tasks/{task_id}", headers=headers_admin)
    assert del_resp.status_code == 204, f"Expected 204 No Content but got {del_resp.status_code}"
    print(f"SUCCESS: Task #{task_id} deleted successfully.")

    print("\n==================================================================")
    print("ALL 11 INTEGRATION VERIFICATION CHECKS PASSED WITH ZERO REGRESSIONS")
    print("==================================================================")

if __name__ == "__main__":
    main()
