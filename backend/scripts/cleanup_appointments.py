import sys
import os
import asyncio

# Agregar backend al PYTHONPATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from services.cleanup import cleanup_old_cancelled_appointments


async def main():
    result = await cleanup_old_cancelled_appointments(days=90)
    print(f"[CLEANUP OK] {result}")


if __name__ == "__main__":
    asyncio.run(main())
