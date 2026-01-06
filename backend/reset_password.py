from auth import pwd_context
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["agencia_automotriz"]
users = db["users"]

new_password = "Admin123!"  # la que tú quieras
hashed = pwd_context.hash(new_password)

users.update_one(
    {"email": "admin@admin.com"},
    {"$set": {"hashed_password": hashed}}
)

print("Password reset OK")

