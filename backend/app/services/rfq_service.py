"""RFQ service — business logic for quote management."""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import RFQ
from app.schemas import RFQCreate, RFQUpdate


class RFQService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: RFQCreate) -> RFQ:
        rfq = RFQ(**data.model_dump())
        self.db.add(rfq)
        self.db.commit()
        self.db.refresh(rfq)
        return rfq

    def list_rfqs(self, status: Optional[str] = None) -> List[RFQ]:
        query = self.db.query(RFQ)
        if status:
            query = query.filter(RFQ.status == status)
        return query.order_by(RFQ.created_at.desc()).all()

    def get_by_id(self, rfq_id: int) -> Optional[RFQ]:
        return self.db.query(RFQ).filter(RFQ.id == rfq_id).first()

    def update(self, rfq: RFQ, data: RFQUpdate) -> RFQ:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(rfq, field, value)
        self.db.commit()
        self.db.refresh(rfq)
        return rfq
