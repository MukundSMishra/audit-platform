"""
Python AI Agent - Example Implementation
FastAPI endpoint for receiving audit batch submissions

Install dependencies:
pip install fastapi uvicorn pydantic
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audit AI Agent", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite/React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class AuditItem(BaseModel):
    audit_item_id: str
    question_text: str
    legal_text: str
    risk_level: str
    category: str
    workflow_type: Literal["manual_observation", "ai_evidence"]
    
    # Manual observation fields
    intern_verdict: Optional[str] = None
    intern_comment: Optional[str] = None
    evidence_url: Optional[str] = None
    
    # AI evidence fields
    intern_evidence: Optional[str] = None
    missing_evidence_reason: Optional[str] = None
    
    # Common fields
    applicability_reason: Optional[str] = None
    is_applicable: bool = True


class AuditBatchRequest(BaseModel):
    batch_id: str
    session_id: str
    company_name: str
    location: str
    submitted_at: str
    audit_items: List[AuditItem]


class AuditBatchResponse(BaseModel):
    status: str
    batch_id: str
    overall_compliance_score: float
    critical_findings: int
    high_risk_findings: int
    recommendations: List[str]
    summary: str
    processed_items: int
    processing_timestamp: str


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Audit AI Agent",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/submit-audit-batch", response_model=AuditBatchResponse)
async def submit_audit_batch(request: AuditBatchRequest):
    """
    Process audit batch submission and generate AI analysis
    
    This is a DEMO implementation. Replace with your actual AI logic.
    """
    try:
        logger.info(f"Received batch submission: {request.batch_id}")
        logger.info(f"Company: {request.company_name}")
        logger.info(f"Items to process: {len(request.audit_items)}")
        
        # === YOUR AI PROCESSING LOGIC HERE ===
        # 1. Analyze evidence URLs (if ai_evidence workflow)
        # 2. Cross-check verdicts with legal requirements
        # 3. Generate compliance scores
        # 4. Identify critical gaps
        # 5. Create recommendations
        
        # Example: Simple analysis
        total_items = len(request.audit_items)
        compliant_items = sum(
            1 for item in request.audit_items 
            if item.intern_verdict == "Compliant"
        )
        non_compliant_items = sum(
            1 for item in request.audit_items 
            if item.intern_verdict == "Non-Compliant"
        )
        
        # Count risk levels
        critical_findings = sum(
            1 for item in request.audit_items 
            if item.risk_level == "Critical" and item.intern_verdict == "Non-Compliant"
        )
        high_risk_findings = sum(
            1 for item in request.audit_items 
            if item.risk_level == "High" and item.intern_verdict == "Non-Compliant"
        )
        
        # Calculate compliance score
        overall_score = (compliant_items / total_items * 100) if total_items > 0 else 0
        
        # Generate recommendations
        recommendations = []
        if critical_findings > 0:
            recommendations.append(
                f"⚠️ URGENT: {critical_findings} critical compliance issues require immediate attention"
            )
        if high_risk_findings > 0:
            recommendations.append(
                f"Address {high_risk_findings} high-risk findings within 30 days"
            )
        if overall_score < 70:
            recommendations.append(
                "Overall compliance is below acceptable threshold. Schedule comprehensive review."
            )
        if non_compliant_items > 0:
            recommendations.append(
                f"Develop action plan for {non_compliant_items} non-compliant items"
            )
        
        # Generate summary
        summary = f"""
        Audit Analysis for {request.company_name} ({request.location})
        
        Total Items Assessed: {total_items}
        Compliant: {compliant_items} ({compliant_items/total_items*100:.1f}%)
        Non-Compliant: {non_compliant_items}
        
        Overall Compliance Score: {overall_score:.2f}%
        
        Critical Issues: {critical_findings}
        High-Risk Issues: {high_risk_findings}
        """.strip()
        
        logger.info(f"Batch {request.batch_id} processed successfully")
        logger.info(f"Overall compliance score: {overall_score:.2f}%")
        
        # Return AI analysis response
        return AuditBatchResponse(
            status="success",
            batch_id=request.batch_id,
            overall_compliance_score=round(overall_score, 2),
            critical_findings=critical_findings,
            high_risk_findings=high_risk_findings,
            recommendations=recommendations,
            summary=summary,
            processed_items=total_items,
            processing_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing batch {request.batch_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process audit batch: {str(e)}"
        )


@app.get("/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """
    Get processing status of a submitted batch
    (Optional - for async processing)
    """
    # TODO: Implement if you need async processing
    return {
        "batch_id": batch_id,
        "status": "completed",  # or "processing", "failed"
        "message": "Batch processing complete"
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Audit AI Agent on http://127.0.0.1:8000")
    logger.info("API documentation available at http://127.0.0.1:8000/docs")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
