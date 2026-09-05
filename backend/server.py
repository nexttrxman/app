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
import requests

# ---------------- Storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "inflowmkt"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- DB ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    return os.environ["JWT_SECRET"]


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
    }


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str


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


# ---------------- Auth routes ----------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id), email)
    return {"token": token, "user": serialize_user(doc)}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token(str(user["_id"]), email)
    return {"token": token, "user": serialize_user(user)}


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
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "storage_path": result["path"],
        "content_type": content_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    backend = os.environ.get("FRONTEND_URL", "")
    return {"url": f"/api/files/{result['path']}"}


@api_router.get("/files/{path:path}")
async def download(path: str):
    record = await db.files.find_one({"storage_path": path})
    try:
        data, content_type = get_object(path)
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return Response(content=data, media_type=(record or {}).get("content_type", content_type))


# ---------------- Wallet ----------------
@api_router.post("/wallet/topup")
async def topup(data: TopUpInput, user: dict = Depends(get_current_user)):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    uid = ObjectId(user["_id"])
    await db.users.update_one({"_id": uid}, {"$inc": {"balance": float(data.amount)}})
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "topup",
        "amount": float(data.amount),
        "method": data.method,
        "description": f"Carga de saldo ({data.method})",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    updated = await db.users.find_one({"_id": uid})
    return {"balance": round(updated["balance"], 2)}


@api_router.post("/wallet/purchase/{product_id}")
async def purchase(product_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"_id": ObjectId(product_id), "is_deleted": {"$ne": True}})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    uid = ObjectId(user["_id"])
    current = await db.users.find_one({"_id": uid})
    if current["balance"] < product["price"]:
        raise HTTPException(status_code=400, detail="Saldo insuficiente. Carga saldo para completar tu compra.")
    await db.users.update_one({"_id": uid}, {"$inc": {"balance": -float(product["price"])}})
    await db.transactions.insert_one({
        "user_id": user["_id"],
        "type": "purchase",
        "amount": -float(product["price"]),
        "product_name": product["name"],
        "product_image": product["image_url"],
        "description": f"Compra: {product['name']}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    updated = await db.users.find_one({"_id": uid})
    return {"balance": round(updated["balance"], 2), "product": product["name"]}


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
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@inflowmkt.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "InflowAdmin2026")
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
    await db.products.update_many({"category": {"$exists": False}}, {"$set": {"category": "General"}})
    await db.products.update_many(
        {"name": {"$in": ["Neon Console X", "Pulse Mouse Pro", "Chrono Watch S"]}},
        {"$set": {"is_deleted": True}},
    )
    social_seed = [
        {"name": "1.000 Seguidores Instagram", "category": "Instagram", "price": 12.0, "description": "Seguidores reales y activos para tu perfil de Instagram.", "image_url": "https://images.unsplash.com/photo-1666408738188-212c470d08b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHwxNzg4NjExNTAwfDA&ixlib=rb-4.1.0&q=85"},
        {"name": "500 Likes Instagram", "category": "Instagram", "price": 5.0, "description": "Impulsa tus publicaciones con likes instantáneos.", "image_url": "https://images.unsplash.com/photo-1554177255-61502b352de3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHwxNzg4NjExNTAwfDA&ixlib=rb-4.1.0&q=85"},
        {"name": "5.000 Seguidores TikTok", "category": "TikTok", "price": 29.0, "description": "Haz crecer tu cuenta de TikTok y llega al FYP.", "image_url": "https://images.unsplash.com/photo-1532134358497-43fa3c6a02b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwxfHx0aWt0b2slMjB5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3IlMjBuZW9ufGVufDB8fHx8MTc4ODYxMTUwMHww&ixlib=rb-4.1.0&q=85"},
        {"name": "10.000 Views TikTok", "category": "TikTok", "price": 8.0, "description": "Multiplica las reproducciones de tus videos.", "image_url": "https://images.unsplash.com/photo-1567845735143-5e5d9d3f8f81?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxpbnN0YWdyYW0lMjBmb2xsb3dlcnMlMjBzb2NpYWwlMjBtZWRpYSUyMG5lb258ZW58MHx8fHwxNzg4NjExNTAwfDA&ixlib=rb-4.1.0&q=85"},
        {"name": "1.000 Suscriptores YouTube", "category": "YouTube", "price": 45.0, "description": "Suscriptores para monetizar tu canal más rápido.", "image_url": "https://images.unsplash.com/photo-1560615253-8b8d1ea96363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHx0aWt0b2slMjB5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3IlMjBuZW9ufGVufDB8fHx8MTc4ODYxMTUwMHww&ixlib=rb-4.1.0&q=85"},
        {"name": "Pack Growth Pro", "category": "Combos", "price": 99.0, "description": "Combo todo en uno: seguidores, likes y views en todas tus redes.", "image_url": "https://images.unsplash.com/photo-1532134358497-43fa3c6a02b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwxfHx0aWt0b2slMjB5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3IlMjBuZW9ufGVufDB8fHx8MTc4ODYxMTUwMHww&ixlib=rb-4.1.0&q=85"},
    ]
    for s in social_seed:
        existing_p = await db.products.find_one({"name": s["name"]})
        if existing_p is None:
            await db.products.insert_one({**s, "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
        else:
            await db.products.update_one({"_id": existing_p["_id"]}, {"$set": {"is_deleted": False}})
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
