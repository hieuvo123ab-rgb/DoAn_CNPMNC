import json
from locust import HttpUser, task, between

class EdmsUser(HttpUser):
    wait_time = between(0.1, 0.5)
    token = None

    def on_start(self):
        # Authenticate as hieu / password123
        resp = self.client.post("/api/auth/login", json={
            "username": "hieu",
            "password": "password123"
        })
        if resp.status_code == 200:
            self.token = resp.json().get("token")

    @property
    def auth_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(4)
    def check_health(self):
        self.client.get("/api/health")

    @task(3)
    def list_documents(self):
        self.client.get("/api/documents?page=0&size=10", headers=self.auth_headers)

    @task(2)
    def search_documents(self):
        self.client.get("/api/documents?q=EDMS&page=0&size=10", headers=self.auth_headers)

    @task(2)
    def get_notifications(self):
        self.client.get("/api/notifications?page=0&size=10", headers=self.auth_headers)

    @task(1)
    def get_system_status(self):
        self.client.get("/api/admin/system/status", headers=self.auth_headers)
