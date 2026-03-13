"""RFQ API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import require_admin
from app.models import RFQ
from app.schemas import RFQCreate, RFQUpdate, RFQRead

router = APIRouter()


@router.post("/rfq", response_model=RFQRead, status_code=201)
def create_rfq(data: RFQCreate, db: Session = Depends(get_db)):
    rfq = RFQ(**data.model_dump())
    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    return rfq


@router.get("/admin/rfq")
def list_rfqs(
    status: str = None,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    q = db.query(RFQ)
    if status:
        q = q.filter(RFQ.status == status)
    rfqs = q.order_by(RFQ.created_at.desc()).all()
    return {"rfqs": rfqs, "total": len(rfqs)}


@router.patch("/admin/rfq/{rfq_id}", response_model=RFQRead)
def update_rfq(
    rfq_id: int,
    data: RFQUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rfq, field, value)
    db.commit()
    db.refresh(rfq)
    return rfq
