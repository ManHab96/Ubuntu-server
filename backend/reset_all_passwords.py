from passlib.context import CryptContext
from pymongo import MongoClient

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

client = MongoClient("mongodb://localhost:27017")
db = client["automotive_agency"]
users = db["users"]

NEW_PASSWORD = "Admin1234!"

for user in users.find({}):
    new_hash = pwd_context.hash(NEW_PASSWORD)
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": new_hash}}
    )
    print(f"✔ Rehasheado: {user['email']}")

print("\n✅ Todos los usuarios ahora usan bcrypt válido")
print("Contraseña para todos:", NEW_PASSWORD)
