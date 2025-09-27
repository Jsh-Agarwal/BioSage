from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.core import Orders, OrdersCreate, OrdersUpdate, OrdersResponse
from app.db import orders_crud, case_crud
from datetime import datetime
from bson import ObjectId

router = APIRouter(tags=["orders"])

def serialize_datetime_fields(data: dict) -> dict:
    """Convert datetime objects to ISO format strings for orders dicts"""
    if not data:
        return data
    serialized = data.copy()
    for key, value in serialized.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    if "_id" in serialized and not isinstance(serialized["_id"], str):
        serialized["_id"] = str(serialized["_id"])
    if "case_id" in serialized and not isinstance(serialized["case_id"], str):
        serialized["case_id"] = str(serialized["case_id"])
    if "order_time" in serialized and isinstance(serialized["order_time"], datetime):
        serialized["order_time"] = serialized["order_time"].isoformat()
    return serialized

async def get_case_by_id_or_caseid(case_id: str):
    """Try to find case by MongoDB _id or by case_id field"""
    case = None
    try:
        case = await case_crud.get_by_id(case_id)
    except Exception:
        case = None
    if not case:
        case = await case_crud.find_one({"case_id": case_id})
    return case

@router.post("/cases/{case_id}/orders", response_model=OrdersResponse)
async def create_order(case_id: str, order_data: OrdersCreate):
    """Create a new order for a case"""
    # Check if case exists
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case_obj_id = case["_id"]

    # Create order data
    order_dict = order_data.model_dump(exclude_unset=True)
    order_dict["case_id"] = case_obj_id
    order_dict["order_time"] = datetime.utcnow()
    if "status" not in order_dict:
        order_dict["status"] = "pending"

    order_id = await orders_crud.create(order_dict)
    created_order = await orders_crud.get_by_id(order_id)
    created_order = serialize_datetime_fields(created_order)

    return OrdersResponse(**created_order)

@router.get("/cases/{case_id}/orders", response_model=List[OrdersResponse])
async def get_case_orders(
    case_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None
):
    """Get all orders for a case"""
    case = await get_case_by_id_or_caseid(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case_obj_id = case["_id"]

    filter_dict = {"case_id": case_obj_id}
    if status:
        filter_dict["status"] = status
    if priority:
        filter_dict["priority"] = priority
    if category:
        filter_dict["category"] = category

    orders = await orders_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="order_time",
        sort_order=-1
    )
    return [OrdersResponse(**serialize_datetime_fields(order)) for order in orders]

@router.get("/orders/{order_id}", response_model=OrdersResponse)
async def get_order(order_id: str):
    """Get order by ID"""
    order = await orders_crud.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = serialize_datetime_fields(order)
    return OrdersResponse(**order)

@router.put("/orders/{order_id}", response_model=OrdersResponse)
async def update_order(order_id: str, order_update: OrdersUpdate):
    """Update order by ID"""
    existing_order = await orders_crud.get_by_id(order_id)
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    update_data = order_update.model_dump(exclude_unset=True)
    success = await orders_crud.update(order_id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update order")
    updated_order = await orders_crud.get_by_id(order_id)
    updated_order = serialize_datetime_fields(updated_order)
    return OrdersResponse(**updated_order)

@router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    """Delete order by ID"""
    success = await orders_crud.delete(order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}

@router.get("/orders", response_model=List[OrdersResponse])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    ai_recommendation: Optional[bool] = None
):
    """Get all orders with filtering"""
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if priority:
        filter_dict["priority"] = priority
    if ai_recommendation is not None:
        filter_dict["ai_recommendation"] = ai_recommendation

    orders = await orders_crud.get_many(
        filter_dict=filter_dict,
        skip=skip,
        limit=limit,
        sort_by="order_time",
        sort_order=-1
    )
    return [OrdersResponse(**serialize_datetime_fields(order)) for order in orders]

@router.get("/orders/stats/summary")
async def get_orders_stats():
    """Get orders statistics summary"""
    total_orders = await orders_crud.count()
    pending_orders = await orders_crud.count({"status": "pending"})
    completed_orders = await orders_crud.count({"status": "completed"})
    ai_recommended_orders = await orders_crud.count({"ai_recommendation": True})

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "ai_recommended_orders": ai_recommended_orders,
        "completion_rate": completed_orders / total_orders if total_orders > 0 else 0
    }