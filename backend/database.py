from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'automotive_agency')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
users_collection = db.users
agencies_collection = db.agencies
cars_collection = db.cars
media_files_collection = db.media_files
promotions_collection = db.promotions
customers_collection = db.customers
appointments_collection = db.appointments
conversations_collection = db.conversations
messages_collection = db.messages
system_config_collection = db.system_config

async def get_database():
    return db
