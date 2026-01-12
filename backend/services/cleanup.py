from datetime import datetime, timedelta
from database import appointments_collection


async def cleanup_old_cancelled_appointments(days: int = 90):
    """
    Elimina citas CANCELLED con más de X días
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    result = await appointments_collection.delete_many({
        "status": "cancelled",
        "deleted_at": {"$lte": cutoff_date}
    })

    return {
        "deleted_count": result.deleted_count,
        "cutoff_date": cutoff_date.isoformat()
    }
