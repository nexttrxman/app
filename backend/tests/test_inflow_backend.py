"""Backend tests for INFLOW MKT marketplace (iteration 2 - social products + categories)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@inflowmkt.com"
ADMIN_PASSWORD = "InflowAdmin2026"

EXPECTED_SEED = {
    "1.000 Seguidores Instagram": "Instagram",
    "500 Likes Instagram": "Instagram",
    "5.000 Seguidores TikTok": "TikTok",
    "10.000 Views TikTok": "TikTok",
    "1.000 Suscriptores YouTube": "YouTube",
    "Pack Growth Pro": "Combos",
}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def user_creds():
    email = f"tester_{uuid.uuid4().hex[:8]}@inflow.com"
    return {"name": "Tester", "email": email, "password": "Test1234"}


@pytest.fixture(scope="module")
def user_token(user_creds):
    r = requests.post(f"{API}/auth/register", json=user_creds)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["balance"] == 0
    assert body["user"]["role"] == "user"
    return body["token"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


class TestAuth:
    def test_register(self, user_token):
        assert user_token

    def test_register_duplicate_fails(self, user_creds, user_token):
        r = requests.post(f"{API}/auth/register", json=user_creds)
        assert r.status_code == 400

    def test_admin_me(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_h(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


class TestProducts:
    def test_list_products_has_social_seed(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        names = {p["name"]: p for p in prods}
        for name, cat in EXPECTED_SEED.items():
            assert name in names, f"Missing seed product: {name}"
            assert names[name]["category"] == cat, f"Wrong category for {name}"
            assert "price" in names[name] and isinstance(names[name]["price"], (int, float))

    def test_products_have_category_field(self):
        prods = requests.get(f"{API}/products").json()
        for p in prods:
            assert "category" in p and p["category"], f"Product {p['name']} missing category"

    def test_categories_endpoint(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        for expected in ["Instagram", "TikTok", "YouTube", "Combos"]:
            assert expected in cats, f"Missing category: {expected}"
        # sorted
        assert cats == sorted(cats)

    def test_non_admin_cannot_create(self, user_token):
        r = requests.post(f"{API}/products", headers=_h(user_token),
                          json={"name": "X", "description": "d", "price": 1.0, "image_url": "http://x", "category": "Instagram"})
        assert r.status_code == 403

    def test_admin_create_with_category_persists(self, admin_token):
        cat = "TEST_CategoryX"
        payload = {
            "name": f"TEST_Prod_{uuid.uuid4().hex[:6]}",
            "description": "test",
            "price": 12.5,
            "image_url": "http://x/y.jpg",
            "category": cat,
        }
        r = requests.post(f"{API}/products", headers=_h(admin_token), json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        pid = body["id"]
        assert body["category"] == cat

        # verify GET returns with category
        prods = requests.get(f"{API}/products").json()
        found = next((p for p in prods if p["id"] == pid), None)
        assert found is not None
        assert found["category"] == cat

        # verify categories endpoint includes the new category
        cats = requests.get(f"{API}/categories").json()
        assert cat in cats

        # cleanup
        r3 = requests.delete(f"{API}/products/{pid}", headers=_h(admin_token))
        assert r3.status_code == 200
        # after delete, category should be gone from distinct list
        cats_after = requests.get(f"{API}/categories").json()
        assert cat not in cats_after

    def test_admin_create_default_category(self, admin_token):
        payload = {
            "name": f"TEST_Default_{uuid.uuid4().hex[:6]}",
            "description": "d",
            "price": 1.0,
            "image_url": "http://x",
        }
        r = requests.post(f"{API}/products", headers=_h(admin_token), json=payload)
        assert r.status_code == 200
        assert r.json()["category"] == "General"
        requests.delete(f"{API}/products/{r.json()['id']}", headers=_h(admin_token))

    def test_non_admin_cannot_delete(self, user_token):
        pid = requests.get(f"{API}/products").json()[0]["id"]
        r = requests.delete(f"{API}/products/{pid}", headers=_h(user_token))
        assert r.status_code == 403


class TestWallet:
    def test_topup_increases_balance(self, user_token):
        r = requests.post(f"{API}/wallet/topup", headers=_h(user_token), json={"amount": 50, "method": "card"})
        assert r.status_code == 200
        assert r.json()["balance"] >= 50
        txs = requests.get(f"{API}/wallet/transactions", headers=_h(user_token)).json()
        assert any(t["type"] == "topup" and t["amount"] == 50 for t in txs)

    def test_topup_zero_fails(self, user_token):
        r = requests.post(f"{API}/wallet/topup", headers=_h(user_token), json={"amount": 0})
        assert r.status_code == 400

    def test_purchase_insufficient(self, user_token):
        prods = requests.get(f"{API}/products").json()
        expensive = max(prods, key=lambda p: p["price"])
        me = requests.get(f"{API}/auth/me", headers=_h(user_token)).json()
        if expensive["price"] > me["balance"]:
            r = requests.post(f"{API}/wallet/purchase/{expensive['id']}", headers=_h(user_token))
            assert r.status_code == 400
            assert "Saldo insuficiente" in r.json().get("detail", "")

    def test_purchase_500_likes_success(self, user_token):
        prods = requests.get(f"{API}/products").json()
        target = next((p for p in prods if p["name"] == "500 Likes Instagram"), None)
        assert target is not None
        me = requests.get(f"{API}/auth/me", headers=_h(user_token)).json()
        if me["balance"] < target["price"]:
            requests.post(f"{API}/wallet/topup", headers=_h(user_token),
                          json={"amount": target["price"] + 10, "method": "card"})
        before = requests.get(f"{API}/auth/me", headers=_h(user_token)).json()["balance"]
        r = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(user_token))
        assert r.status_code == 200, r.text
        assert r.json()["balance"] == round(before - target["price"], 2)
        txs = requests.get(f"{API}/wallet/transactions", headers=_h(user_token)).json()
        assert any(t["type"] == "purchase" and t.get("product_name") == target["name"] for t in txs)

    def test_transactions_requires_auth(self):
        r = requests.get(f"{API}/wallet/transactions")
        assert r.status_code == 401
