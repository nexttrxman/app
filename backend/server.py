from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt
import cloudinary
import cloudinary.uploader

# ---------------- DB ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------- Cloudinary ----------------
cloudinary.config(url=os.environ.get('CLOUDINARY_URL'))

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"
MIME_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}

PyObjectId = Annotated[str, BeforeValidator(str)]


# ---------------- Auth helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        secret = "dev-secret-change-me"
        logger.warning("JWT_SECRET not set; using a development fallback. Configure a strong secret in production.")
    return secret


def set_auth_cookie(response: Response, token: str):
    secure = os.environ.get("COOKIE_SECURE", "true").lower() in {"1", "true", "yes", "on"}
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return user


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "balance": round(user.get("balance", 0.0), 2),
        "referral_code": user.get("referral_code", ""),
    }


# ---------------- Referrals & coupons config ----------------
REFERRAL_WELCOME_BONUS = 3.0
REFERRAL_COMMISSION_PERCENT = 15.0
SCOPE_LABELS = {"purchase": "compras", "topup": "cargas de saldo", "both": "compras y cargas"}


def build_referral_code(name: str, email: str) -> str:
    base = "".join(ch for ch in (name or email.split("@")[0]) if ch.isalnum()).upper()[:6] or "INFLOW"
    return f"{base}{uuid.uuid4().hex[:4].upper()}"


async def get_valid_coupon(code: str, scope: str, user_id: str) -> dict:
    code = (code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Ingresa un código de cupón")
    coupon = await db.coupons.find_one({"code": code, "active": True})
    if not coupon:
        raise HTTPException(status_code=400, detail="Cupón inválido o inactivo")
    if coupon.get("scope", "both") not in (scope, "both"):
        raise HTTPException(
            status_code=400,
            detail=f"Este cupón solo aplica a {SCOPE_LABELS.get(coupon.get('scope', 'both'))}",
        )
    if await db.coupon_redemptions.find_one({"code": code, "user_id": user_id}):
        raise HTTPException(status_code=400, detail="Ya usaste este cupón")
    return coupon


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    referral_code: Optional[str] = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ProductInput(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str = "General"


class TopUpInput(BaseModel):
    amount: float
    method: str = "card"
    coupon_code: Optional[str] = None


class PurchaseInput(BaseModel):
    coupon_code: Optional[str] = None
    target_username: Optional[str] = None
    quantity: Optional[int] = None
    platform: Optional[str] = None
    service_type: Optional[str] = None
    currency: Optional[str] = "ARS"


class CouponInput(BaseModel):
    code: str
    percent: float
    scope: str = "both"  # purchase | topup | both


class CouponToggleInput(BaseModel):
    active: bool


# ---------------- Auth routes ----------------
@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    referrer = None
    if data.referral_code:
        referrer = await db.users.find_one({"referral_code": data.referral_code.strip().upper()})
    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "balance": REFERRAL_WELCOME_BONUS if referrer else 0.0,
        "referral_code": build_referral_code(data.name, email),
        "referred_by": str(referrer["_id"]) if referrer else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    if referrer:
        now = datetime.now(timezone.utc).isoformat()
        await db.transactions.insert_one({
            "user_id": str(result.inserted_id),
            "type": "bonus",
            "amount": REFERRAL_WELCOME_BONUS,
            "description": f"Bono de bienvenida por invitación de {referrer.get('name', '')}",
            "created_at": now,
        })
        await db.referral_events.insert_one({
            "referrer_id": str(referrer["_id"]),
            "referred_id": str(result.inserted_id),
            "referred_name": data.name,
            "type": "signup",
            "amount": 0.0,
            "created_at": now,
        })
    token = create_access_token(str(result.inserted_id), email)
    set_auth_cookie(response, token)
    return {"token": token, "user": serialize_user(doc)}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token(str(user["_id"]), email)
    set_auth_cookie(response, token)
    return {"token": token, "user": serialize_user(user)}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return serialize_user(full)


# ---------------- Products ----------------
@api_router.get("/products")
async def list_products():
    products = await db.products.find({"is_deleted": {"$ne": True}}).sort("created_at", -1).to_list(1000)
    return [{
        "id": str(p["_id"]),
        "name": p["name"],
        "description": p["description"],
        "price": round(p["price"], 2),
        "image_url": p["image_url"],
        "category": p.get("category", "General"),
    } for p in products]


@api_router.get("/categories")
async def list_categories():
    cats = await db.products.distinct("category", {"is_deleted": {"$ne": True}})
    return sorted([c for c in cats if c])


@api_router.post("/products")
async def create_product(data: ProductInput, admin: dict = Depends(require_admin)):
    doc = {
        "name": data.name,
        "description": data.description,
        "price": float(data.price),
        "image_url": data.image_url,
        "category": data.category or "General",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.products.insert_one(doc)
    return {"id": str(result.inserted_id), **{k: doc[k] for k in ["name", "description", "price", "image_url", "category"]}}


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"is_deleted": True}})
    return {"success": True}


@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    # Subir a Cloudinary
    result = cloudinary.uploader.upload(
        file.file,
        folder="inflow/products",
        resource_type="image",
        format=ext,
    )
    
    return {"url": result["secure_url"]}


# ---------------- Wallet ----------------
@api_router.post("/wallet/topup")
async def topup(data: TopUpInput, user: dict = Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    amount = float(data.amount)
    coupon = None
    bonus = 0.0
    if data.coupon_code:
        coupon = await get_valid_coupon(data.coupon_code, "topup", user["_id"])
        bonus = round(amount * coupon["percent"] / 100, 2)
    uid = ObjectId(user["_id"])
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"_id": uid}, {"$inc": {"balance": amount + bonus}})
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "topup",
        "amount": amount,
        "method": data.method,
        "description": f"Carga de saldo ({data.method})",
        "created_at": now,
    })
    if coupon:
        await db.transactions.insert_one({
            "user_id": user["_id"],
            "type": "bonus",
            "amount": bonus,
            "description": f"Bono cupón {coupon['code']} (+{coupon['percent']:g}%)",
            "created_at": now,
        })
        await db.coupon_redemptions.insert_one({
            "code": coupon["code"],
            "user_id": user["_id"],
            "type": "topup",
            "amount_saved": bonus,
            "created_at": now,
        })
    updated = await db.users.find_one({"_id": uid})
    return {"balance": round(updated["balance"], 2), "bonus": bonus}


@api_router.post("/wallet/purchase/{product_id}")
async def purchase(product_id: str, data: Optional[PurchaseInput] = None, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"_id": ObjectId(product_id), "is_deleted": {"$ne": True}})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Calcular precio según pack o precio fijo del producto
    price = float(product["price"])
    pack_price = None
    
    # Si viene con datos de pack, calcular precio dinámico
    if data and data.quantity and data.platform and data.service_type:
        # Precios base por plataforma y servicio (ARS por unidad)
        BASE_PRICES = {
            "instagram": {"seguidores": 29.6, "likes": 5.9, "views": 2.9, "reels": 8.9, "guardados": 12.9, "shares": 9.9},
            "youtube": {"suscriptores": 45.0, "views": 3.5, "likes": 6.5, "horas": 15.0},
            "tiktok": {"seguidores": 25.0, "views": 2.5, "likes": 5.5, "shares": 8.5},
            "facebook": {"seguidores": 22.0, "likes": 5.0, "views": 2.0, "shares": 7.5},
            "spotify": {"seguidores": 35.0, "streams": 4.5, "saves": 10.0},
        }
        
        # Descuentos por cantidad (igual que el frontend)
        DISCOUNTS = {
            100: 15, 250: 22, 500: 30, 1000: 40, 1500: 48, 2000: 55, 2500: 60, 5000: 65,
        }
        
        platform_lower = data.platform.lower()
        service_lower = data.service_type.lower()
        
        if platform_lower in BASE_PRICES and service_lower in BASE_PRICES[platform_lower]:
            base_price_per_unit = BASE_PRICES[platform_lower][service_lower]
            list_price = base_price_per_unit * data.quantity
            discount_percent = DISCOUNTS.get(data.quantity, 0)
            pack_price = round(list_price * (1 - discount_percent / 100), 2)
            price = pack_price
    
    coupon = None
    discount = 0.0
    if data and data.coupon_code:
        coupon = await get_valid_coupon(data.coupon_code, "purchase", user["_id"])
        discount = round(price * coupon["percent"] / 100, 2)
    
    total = round(price - discount, 2)
    uid = ObjectId(user["_id"])
    current = await db.users.find_one({"_id": uid})
    
    if current["balance"] < total:
        raise HTTPException(status_code=400, detail="Saldo insuficiente. Carga saldo para completar tu compra.")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"_id": uid}, {"$inc": {"balance": -total}})
    
    # Crear transacción con datos del pack si existen
    transaction_doc = {
        "user_id": user["_id"],
        "type": "purchase",
        "amount": -total,
        "product_name": product["name"],
        "product_image": product["image_url"],
        "description": f"Compra: {product['name']}" + (f" · cupón {coupon['code']} -{coupon['percent']:g}%" if coupon else ""),
        "created_at": now,
    }
    
    # Agregar datos del pack si existen
    if data and data.target_username and data.quantity and data.platform and data.service_type:
        transaction_doc["target_username"] = data.target_username
        transaction_doc["quantity"] = data.quantity
        transaction_doc["platform"] = data.platform
        transaction_doc["service_type"] = data.service_type
        transaction_doc["pack_price"] = pack_price
        transaction_doc["description"] = f"Compra: {data.quantity} {data.service_type} en {data.platform} para @{data.target_username}" + (f" · cupón {coupon['code']} -{coupon['percent']:g}%" if coupon else "")
    
    await db.transactions.insert_one(transaction_doc)
    
    if coupon:
        await db.coupon_redemptions.insert_one({
            "code": coupon["code"],
            "user_id": user["_id"],
            "type": "purchase",
            "amount_saved": discount,
            "created_at": now,
        })

    # referral commission for the inviter
    referrer_id = current.get("referred_by")
    commission = round(total * REFERRAL_COMMISSION_PERCENT / 100, 2) if referrer_id else 0.0
    if referrer_id and commission > 0 and ObjectId.is_valid(referrer_id) and referrer_id != user["_id"]:
        await db.users.update_one({"_id": ObjectId(referrer_id)}, {"$inc": {"balance": commission}})
        await db.transactions.insert_one({
            "user_id": referrer_id,
            "type": "referral",
            "amount": commission,
            "description": f"Comisión por referido: {current.get('name', '')}",
            "created_at": now,
        })
        await db.referral_events.insert_one({
            "referrer_id": referrer_id,
            "referred_id": user["_id"],
            "referred_name": current.get("name", ""),
            "type": "commission",
            "amount": commission,
            "created_at": now,
        })

    updated = await db.users.find_one({"_id": uid})
    return {
        "balance": round(updated["balance"], 2),
        "product": product["name"],
        "price": price,
        "discount": discount,
        "total": total,
        "quantity": data.quantity if data else None,
        "platform": data.platform if data else None,
        "service_type": data.service_type if data else None,
        "target_username": data.target_username if data else None,
    }

    # referral commission for the inviter
    referrer_id = current.get("referred_by")
    commission = round(total * REFERRAL_COMMISSION_PERCENT / 100, 2) if referrer_id else 0.0
    if referrer_id and commission > 0 and ObjectId.is_valid(referrer_id) and referrer_id != user["_id"]:
        await db.users.update_one({"_id": ObjectId(referrer_id)}, {"$inc": {"balance": commission}})
        await db.transactions.insert_one({
            "user_id": referrer_id,
            "type": "referral",
            "amount": commission,
            "description": f"Comisión por referido: {current.get('name', '')}",
            "created_at": now,
        })
        await db.referral_events.insert_one({
            "referrer_id": referrer_id,
            "referred_id": user["_id"],
            "referred_name": current.get("name", ""),
            "type": "commission",
            "amount": commission,
            "created_at": now,
        })

    updated = await db.users.find_one({"_id": uid})
    return {
        "balance": round(updated["balance"], 2),
        "product": product["name"],
        "price": price,
        "discount": discount,
        "total": total,
    }


@api_router.get("/wallet/transactions")
async def transactions(user: dict = Depends(get_current_user)):
    txs = await db.transactions.find({"user_id": user["_id"]}).sort("created_at", -1).to_list(1000)
    return [{
        "id": str(t["_id"]),
        "type": t["type"],
        "amount": round(t["amount"], 2),
        "description": t.get("description", ""),
        "product_name": t.get("product_name"),
        "product_image": t.get("product_image"),
        "created_at": t["created_at"],
    } for t in txs]


# ---------------- Coupons ----------------
@api_router.get("/coupons/validate")
async def validate_coupon(code: str, scope: str = "purchase", user: dict = Depends(get_current_user)):
    if scope not in SCOPE_LABELS:
        raise HTTPException(status_code=400, detail="Alcance inválido")
    coupon = await get_valid_coupon(code, scope, user["_id"])
    return {"code": coupon["code"], "percent": coupon["percent"], "scope": coupon.get("scope", "both")}


@api_router.get("/admin/coupons")
async def list_coupons(admin: dict = Depends(require_admin)):
    coupons = await db.coupons.find().sort("created_at", -1).to_list(500)
    out = []
    for c in coupons:
        uses = await db.coupon_redemptions.count_documents({"code": c["code"]})
        out.append({
            "id": str(c["_id"]),
            "code": c["code"],
            "percent": c["percent"],
            "scope": c.get("scope", "both"),
            "active": c.get("active", True),
            "uses": uses,
        })
    return out


@api_router.post("/admin/coupons")
async def create_coupon(data: CouponInput, admin: dict = Depends(require_admin)):
    code = data.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="El código no puede estar vacío")
    if not 1 <= data.percent <= 100:
        raise HTTPException(status_code=400, detail="El porcentaje debe estar entre 1 y 100")
    if data.scope not in SCOPE_LABELS:
        raise HTTPException(status_code=400, detail="Alcance inválido")
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(status_code=400, detail="Ese código ya existe")
    doc = {
        "code": code,
        "percent": float(data.percent),
        "scope": data.scope,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.coupons.insert_one(doc)
    return {"id": str(result.inserted_id), "code": code, "percent": doc["percent"], "scope": data.scope, "active": True, "uses": 0}


@api_router.patch("/admin/coupons/{coupon_id}")
async def toggle_coupon(coupon_id: str, data: CouponToggleInput, admin: dict = Depends(require_admin)):
    await db.coupons.update_one({"_id": ObjectId(coupon_id)}, {"$set": {"active": data.active}})
    return {"success": True, "active": data.active}


@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: dict = Depends(require_admin)):
    await db.coupons.delete_one({"_id": ObjectId(coupon_id)})
    return {"success": True}


# ---------------- Referrals ----------------
@api_router.get("/referrals/me")
async def my_referrals(user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"_id": ObjectId(user["_id"])})
    code = full.get("referral_code")
    if not code:
        code = build_referral_code(full.get("name", ""), full["email"])
        await db.users.update_one({"_id": full["_id"]}, {"$set": {"referral_code": code}})
    referred = await db.users.find({"referred_by": user["_id"]}).sort("created_at", -1).to_list(500)
    events = await db.referral_events.find({"referrer_id": user["_id"], "type": "commission"}).to_list(2000)
    earned_by_user = {}
    for e in events:
        earned_by_user[e["referred_id"]] = earned_by_user.get(e["referred_id"], 0.0) + e["amount"]
    return {
        "code": code,
        "commission_percent": REFERRAL_COMMISSION_PERCENT,
        "welcome_bonus": REFERRAL_WELCOME_BONUS,
        "total_referred": len(referred),
        "total_earned": round(sum(earned_by_user.values()), 2),
        "referrals": [{
            "id": str(r["_id"]),
            "name": r.get("name", ""),
            "joined_at": r.get("created_at"),
            "earned": round(earned_by_user.get(str(r["_id"]), 0.0), 2),
        } for r in referred],
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = (os.environ.get("ADMIN_EMAIL") or "admin@localhost").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if admin_password:
        existing = await db.users.find_one({"email": admin_email})
        if existing is None:
            await db.users.insert_one({
                "name": "Admin INFLOW",
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "role": "admin",
                "balance": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        elif not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})
    else:
        logger.warning("ADMIN_PASSWORD not set. No default admin account will be created. Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before deploying.")
    await db.products.update_many({"category": {"$exists": False}}, {"$set": {"category": "General"}})
    await db.products.update_many(
        {"name": {"$in": ["Neon Console X", "Pulse Mouse Pro", "Chrono Watch S"]}},
        {"$set": {"is_deleted": True}},
    )
    social_seed = [
        {"name": "1.000 Seguidores Instagram", "category": "Instagram", "price": 12.0, "description": "Seguidores reales y activos para tu perfil de Instagram.", "image_url": "https://images.unsplash.com/photo-1666408738188-212c470d08b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHwxNzg4NjExNTAwfDA&ixlib=rb-4.1.0&q=85"},
        {"name": "500 Likes Instagram", "category": "Instagram", "price": 5.0, "description": "Impulsa tus publicaciones con likes instantáneos.", "image_url": "https://images.unsplash.com/photo-1554177255-61502b352de3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHx8MTc4ODYxMTUwMHww&ixlib=rb-4.1.0&q=85"},
        {"name": "5.000 Seguidores TikTok", "category": "TikTok", "price": 29.0, "description": "Haz crecer tu cuenta de TikTok y llega al FYP.", "image_url": "https://images.unsplash.com/photo-1532134358497-43fa3c6a02b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwxfHx0aWt0b2slMjB5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3IlMjBuZW9ufGVufDB8fHx8fDE3ODg2MTE1MDB8MA&ixlib=rb-4.1.0&q=85"},
        {"name": "10.000 Views TikTok", "category": "TikTok", "price": 8.0, "description": "Multiplica las reproducciones de tus videos.", "image_url": "https://images.unsplash.com/photo-1567845735143-5e5d9d3f8f81?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHx8MTc4ODYxMTUwMHww&ixlib=rb-4.1.0&q=85"},
        {"name": "1.000 Suscriptores YouTube", "category": "YouTube", "price": 45.0, "description": "Suscriptores para monetizar tu canal más rápido.", "image_url": "https://images.unsplash.com/photo-1560615253-8b8d1ea96363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHx0aWt0b2slMjB5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3IlMjBuZW9ufGVufDB8fHx8fDE3ODg2MTE1MDB8MA&ixlib=rb-4.1.0&q=85"},
        {"name": "Pack Growth Pro", "category": "Combos", "price": 99.0, "description": "Combo todo en uno: seguidores, likes y views en todas tus redes.", "image_url": "https://images.unsplash.com/photo-1522125670776-3c7abb882bc2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHx3b21hbiUyMHVzaW5nJTIwcGhvbmUlMjBzb2NpYWwlMjBtZWRpYXxlbnwwfHx8fDE3ODg2MTI0MDh8MA&ixlib=rb-4.1.0&q=85"},
    ]
    for s in social_seed:
        existing_p = await db.products.find_one({"name": s["name"]})
        if existing_p is None:
            await db.products.insert_one({**s, "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
        else:
            await db.products.update_one({"_id": existing_p["_id"]}, {"$set": {"is_deleted": False}})
    # backfill referral codes for existing users
    async for u in db.users.find({"referral_code": {"$in": [None, ""]}}):
        await db.users.update_one(
            {"_id": u["_id"]},
            {"$set": {"referral_code": build_referral_code(u.get("name", ""), u["email"])}},
        )
    await db.coupons.create_index("code", unique=True)
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_many([
            {"code": "INFLOW20", "percent": 20.0, "scope": "purchase", "active": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"code": "BIENVENIDA10", "percent": 10.0, "scope": "topup", "active": True,
             "created_at": datetime.now(timezone.utc).isoformat()},
        ])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
