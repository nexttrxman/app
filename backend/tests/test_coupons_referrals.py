"""Backend tests for coupons + referrals (iteration 4)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@inflowmkt.com"
ADMIN_PASSWORD = "InflowAdmin2026"


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


def _register(name=None, referral_code=None):
    email = f"tester_{uuid.uuid4().hex[:10]}@inflow.com"
    payload = {"name": name or "Tester", "email": email, "password": "Test1234"}
    if referral_code:
        payload["referral_code"] = referral_code
    r = requests.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    return body["token"], body["user"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------------- Coupon validate ----------------
class TestCouponValidate:
    def test_inflow20_valid_for_purchase(self):
        tok, _ = _register()
        r = requests.get(f"{API}/coupons/validate", params={"code": "INFLOW20", "scope": "purchase"}, headers=_h(tok))
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["percent"] == 20
        assert j["code"] == "INFLOW20"

    def test_inflow20_rejected_for_topup(self):
        tok, _ = _register()
        r = requests.get(f"{API}/coupons/validate", params={"code": "INFLOW20", "scope": "topup"}, headers=_h(tok))
        assert r.status_code == 400
        assert "compras" in r.json().get("detail", "").lower()

    def test_bienvenida10_valid_for_topup(self):
        tok, _ = _register()
        r = requests.get(f"{API}/coupons/validate", params={"code": "BIENVENIDA10", "scope": "topup"}, headers=_h(tok))
        assert r.status_code == 200
        assert r.json()["percent"] == 10

    def test_invalid_code(self):
        tok, _ = _register()
        r = requests.get(f"{API}/coupons/validate", params={"code": "NOEXISTE_XYZ", "scope": "purchase"}, headers=_h(tok))
        assert r.status_code == 400
        assert "inválido" in r.json().get("detail", "").lower() or "invalido" in r.json().get("detail", "").lower()

    def test_validate_requires_auth(self):
        r = requests.get(f"{API}/coupons/validate", params={"code": "INFLOW20", "scope": "purchase"})
        assert r.status_code == 401


# ---------------- Purchase with coupon ----------------
class TestPurchaseCoupon:
    def test_purchase_with_coupon_discount(self, admin_token):
        # find product '10.000 Views TikTok' (price 8) — cheap
        prods = requests.get(f"{API}/products").json()
        target = next(p for p in prods if p["name"] == "10.000 Views TikTok")
        tok, user = _register()
        # topup 20
        r = requests.post(f"{API}/wallet/topup", headers=_h(tok), json={"amount": 20, "method": "card"})
        assert r.status_code == 200
        # purchase with INFLOW20
        r = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(tok), json={"coupon_code": "INFLOW20"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["price"] == 8.0
        assert j["discount"] == round(8 * 0.2, 2)
        assert j["total"] == round(8 - 8 * 0.2, 2)

    def test_reuse_same_coupon_rejected(self):
        prods = requests.get(f"{API}/products").json()
        target = next(p for p in prods if p["name"] == "10.000 Views TikTok")
        tok, _ = _register()
        requests.post(f"{API}/wallet/topup", headers=_h(tok), json={"amount": 50})
        r1 = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(tok), json={"coupon_code": "INFLOW20"})
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(tok), json={"coupon_code": "INFLOW20"})
        assert r2.status_code == 400
        assert "ya usaste" in r2.json()["detail"].lower()

    def test_invalid_coupon_on_purchase(self):
        prods = requests.get(f"{API}/products").json()
        target = next(p for p in prods if p["name"] == "10.000 Views TikTok")
        tok, _ = _register()
        requests.post(f"{API}/wallet/topup", headers=_h(tok), json={"amount": 50})
        r = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(tok), json={"coupon_code": "NOPE_XX"})
        assert r.status_code == 400
        assert "inválido" in r.json()["detail"].lower() or "invalido" in r.json()["detail"].lower()


# ---------------- Topup with coupon ----------------
class TestTopupCoupon:
    def test_topup_with_bienvenida10_gives_bonus(self):
        tok, _ = _register()
        r = requests.post(f"{API}/wallet/topup", headers=_h(tok), json={"amount": 50, "coupon_code": "BIENVENIDA10"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["bonus"] == 5.0
        assert j["balance"] == 55.0
        # two transactions: topup + bonus
        txs = requests.get(f"{API}/wallet/transactions", headers=_h(tok)).json()
        types = [t["type"] for t in txs]
        assert "topup" in types and "bonus" in types


# ---------------- Referrals ----------------
class TestReferrals:
    def test_signup_with_referral_bonus(self):
        # inviter
        inviter_tok, inviter = _register(name="Inviter")
        code = inviter["referral_code"]
        assert code
        # invitee
        _, invitee = _register(name="Invitee", referral_code=code)
        assert invitee["balance"] == 5.0

    def test_signup_invalid_referral_code_ok(self):
        _, user = _register(referral_code="NOEXISTE_ZZ")
        assert user["balance"] == 0.0

    def test_referrals_me_endpoint(self):
        inviter_tok, inviter = _register(name="Inv")
        code = inviter["referral_code"]
        _register(name="A", referral_code=code)
        _register(name="B", referral_code=code)
        r = requests.get(f"{API}/referrals/me", headers=_h(inviter_tok))
        assert r.status_code == 200
        j = r.json()
        assert j["code"] == code
        assert j["total_referred"] == 2
        assert isinstance(j["referrals"], list) and len(j["referrals"]) == 2

    def test_referral_commission_on_purchase(self):
        prods = requests.get(f"{API}/products").json()
        target = next(p for p in prods if p["name"] == "10.000 Views TikTok")  # $8
        inviter_tok, inviter = _register(name="Inv")
        code = inviter["referral_code"]
        invitee_tok, _ = _register(name="Ref", referral_code=code)
        # invitee has $5 welcome. purchase costs 8. topup 10.
        requests.post(f"{API}/wallet/topup", headers=_h(invitee_tok), json={"amount": 10})
        r = requests.post(f"{API}/wallet/purchase/{target['id']}", headers=_h(invitee_tok))
        assert r.status_code == 200
        total = r.json()["total"]
        expected_commission = round(total * 0.10, 2)
        # check inviter balance +commission
        me = requests.get(f"{API}/auth/me", headers=_h(inviter_tok)).json()
        assert me["balance"] == expected_commission
        # check referral transaction
        txs = requests.get(f"{API}/wallet/transactions", headers=_h(inviter_tok)).json()
        assert any(t["type"] == "referral" and t["amount"] == expected_commission for t in txs)
        # /referrals/me total_earned reflects
        rm = requests.get(f"{API}/referrals/me", headers=_h(inviter_tok)).json()
        assert rm["total_earned"] == expected_commission


# ---------------- Admin coupons ----------------
class TestAdminCoupons:
    def test_user_forbidden(self):
        tok, _ = _register()
        assert requests.get(f"{API}/admin/coupons", headers=_h(tok)).status_code == 403
        assert requests.post(f"{API}/admin/coupons", headers=_h(tok), json={"code": "X", "percent": 10}).status_code == 403

    def test_admin_crud(self, admin_token):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        # create
        r = requests.post(f"{API}/admin/coupons", headers=_h(admin_token),
                          json={"code": code, "percent": 15, "scope": "both"})
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        # duplicate
        r2 = requests.post(f"{API}/admin/coupons", headers=_h(admin_token),
                           json={"code": code, "percent": 20, "scope": "both"})
        assert r2.status_code == 400
        # invalid percent
        r3 = requests.post(f"{API}/admin/coupons", headers=_h(admin_token),
                           json={"code": f"BAD{uuid.uuid4().hex[:5].upper()}", "percent": 150, "scope": "both"})
        assert r3.status_code == 400
        r4 = requests.post(f"{API}/admin/coupons", headers=_h(admin_token),
                           json={"code": f"BAD{uuid.uuid4().hex[:5].upper()}", "percent": 0, "scope": "both"})
        assert r4.status_code == 400
        # list contains it
        listing = requests.get(f"{API}/admin/coupons", headers=_h(admin_token)).json()
        assert any(c["code"] == code for c in listing)
        # toggle off
        rp = requests.patch(f"{API}/admin/coupons/{cid}", headers=_h(admin_token), json={"active": False})
        assert rp.status_code == 200
        # validate as user -> now inactive
        utok, _ = _register()
        rv = requests.get(f"{API}/coupons/validate", params={"code": code, "scope": "purchase"}, headers=_h(utok))
        assert rv.status_code == 400
        # reactivate then delete
        requests.patch(f"{API}/admin/coupons/{cid}", headers=_h(admin_token), json={"active": True})
        rd = requests.delete(f"{API}/admin/coupons/{cid}", headers=_h(admin_token))
        assert rd.status_code == 200
        after = requests.get(f"{API}/admin/coupons", headers=_h(admin_token)).json()
        assert not any(c["code"] == code for c in after)
