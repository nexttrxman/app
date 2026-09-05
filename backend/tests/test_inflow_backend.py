"""Backend tests for INFLOW MKT marketplace."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://inflow-shop.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@inflowmkt.com"
ADMIN_PASSWORD = "InflowAdmin2026"


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
    assert "token" in body and "user" in body
    assert body["user"]["balance"] == 0
    assert body["user"]["role"] == "user"
    return body["token"]


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ------------- Auth -------------
class TestAuth:
    def test_register_returns_token_and_balance_zero(self, user_token):
        # user_token fixture asserts
        assert user_token

    def test_register_duplicate_fails(self, user_creds, user_token):
        r = requests.post(f"{API}/auth/register", json=user_creds)
        assert r.status_code == 400

    def test_admin_login_and_me(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_h(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"
        assert data["email"] == ADMIN_EMAIL

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ------------- Products -------------
class TestProducts:
    def test_list_products_public(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        assert isinstance(prods, list)
        assert len(prods) >= 3
        names = [p["name"] for p in prods]
        for expected in ["Neon Console X", "Pulse Mouse Pro", "Chrono Watch S"]:
            assert expected in names

    def test_non_admin_cannot_create(self, user_token):
        r = requests.post(f"{API}/products", headers=_h(user_token),
                          json={"name": "X", "description": "d", "price": 1.0, "image_url": "http://x"})
        assert r.status_code == 403

    def test_admin_create_and_delete(self, admin_token):
        payload = {"name": f"TEST_Prod_{uuid.uuid4().hex[:6]}", "description": "test", "price": 12.5, "image_url": "http://x/y.jpg"}
        r = requests.post(f"{API}/products", headers=_h(admin_token), json=payload)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        # verify listed
        r2 = requests.get(f"{API}/products")
        assert any(p["id"] == pid for p in r2.json())
        # delete
        r3 = requests.delete(f"{API}/products/{pid}", headers=_h(admin_token))
        assert r3.status_code == 200
        r4 = requests.get(f"{API}/products")
        assert not any(p["id"] == pid for p in r4.json())

    def test_non_admin_cannot_delete(self, user_token):
        r = requests.get(f"{API}/products")
        pid = r.json()[0]["id"]
        r2 = requests.delete(f"{API}/products/{pid}", headers=_h(user_token))
        assert r2.status_code == 403


# ------------- Wallet -------------
class TestWallet:
    def test_topup_increases_balance_and_records_tx(self, user_token):
        r = requests.post(f"{API}/wallet/topup", headers=_h(user_token), json={"amount": 100, "method": "card"})
        assert r.status_code == 200
        assert r.json()["balance"] >= 100
        # tx list
        r2 = requests.get(f"{API}/wallet/transactions", headers=_h(user_token))
        assert r2.status_code == 200
        txs = r2.json()
        assert any(t["type"] == "topup" and t["amount"] == 100 for t in txs)

    def test_topup_zero_fails(self, user_token):
        r = requests.post(f"{API}/wallet/topup", headers=_h(user_token), json={"amount": 0})
        assert r.status_code == 400

    def test_purchase_insufficient(self, user_token):
        # find expensive product
        prods = requests.get(f"{API}/products").json()
        expensive = max(prods, key=lambda p: p["price"])
        # ensure balance is below its price by not topping enough - the user has 100 from prev test
        # Neon Console X is 499
        if expensive["price"] > 100:
            r = requests.post(f"{API}/wallet/purchase/{expensive['id']}", headers=_h(user_token))
            assert r.status_code == 400
            assert "Saldo insuficiente" in r.json().get("detail", "")

    def test_purchase_success_deducts_and_records(self, user_token):
        prods = requests.get(f"{API}/products").json()
        cheap = min(prods, key=lambda p: p["price"])
        # ensure enough balance
        me = requests.get(f"{API}/auth/me", headers=_h(user_token)).json()
        if me["balance"] < cheap["price"]:
            requests.post(f"{API}/wallet/topup", headers=_h(user_token),
                          json={"amount": cheap["price"] + 10, "method": "card"})
        before = requests.get(f"{API}/auth/me", headers=_h(user_token)).json()["balance"]
        r = requests.post(f"{API}/wallet/purchase/{cheap['id']}", headers=_h(user_token))
        assert r.status_code == 200, r.text
        assert r.json()["balance"] == round(before - cheap["price"], 2)
        # tx present
        txs = requests.get(f"{API}/wallet/transactions", headers=_h(user_token)).json()
        assert any(t["type"] == "purchase" and t.get("product_name") == cheap["name"] for t in txs)

    def test_transactions_requires_auth(self):
        r = requests.get(f"{API}/wallet/transactions")
        assert r.status_code == 401
