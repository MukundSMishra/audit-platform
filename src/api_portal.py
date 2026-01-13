"""
Master Document Architecture API Router
Unified backend for Audit Platform

This API routes audit items to specialist agents based on:
1. Category field (environment, wages, safety, etc.)
2. audit_item_id prefix (ACT-RULE, CW-2019-SEC-, OSHWC-SEC-, etc.)

Active Agents:
✓ EnvironmentAgent (ACT-RULE-* prefixes and 'environment' category)

Deprecated/Commented Out:
✗ wages_agent (Phase 2 migration)
✗ occupational_safety_agent (Phase 2 migration)
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# IMPORT NEW ENVIRONMENT AGENT
# ============================================
from src.agents.environment_agent import analyze_environment_query

# ============================================
# DEPRECATED AGENT IMPORTS (COMMENTED OUT)
# ============================================
# from src.agents.wages_agent import analyze_wages_query
# from src.agents.occupational_safety_agent import analyze_safety_query

# ============================================
# FASTAPI APP SETUP
# ============================================

app = FastAPI(
    title="Audit Platform - Master Document Architecture",
    version="2.0.0",
    description="Unified API with specialist agents for environmental, wages, and safety audits"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# PYDANTIC MODELS
# ============================================

class AuditItem(BaseModel):
    """Single audit item for compliance verification"""
    audit_item_id: str = Field(..., description="e.g., ACT-RULE-ENV-001, CW-2019-SEC-001")
    question_text: str = Field(..., description="The compliance question")
    legal_text: str = Field(..., description="Reference to legal requirement")
    risk_level: str = Field(..., description="Critical, High, Medium, Low")
    category: str = Field(..., description="environment, wages, safety, etc.")
    workflow_type: Literal["manual_observation", "ai_evidence"] = Field(default="ai_evidence")
    
    # Manual observation fields
    intern_verdict: Optional[str] = Field(None, description="Compliant, Non-Compliant, Needs Review")
    intern_comment: Optional[str] = None
    evidence_url: Optional[str] = None
    
    # AI evidence fields
    intern_evidence: Optional[str] = None
    missing_evidence_reason: Optional[str] = None
    
    # Common fields
    applicability_reason: Optional[str] = None
    is_applicable: bool = True


class AuditBatchRequest(BaseModel):
    """Request model for batch audit submission"""
    batch_id: str
    session_id: str
    company_name: str
    location: str
    submitted_at: str
    audit_items: List[AuditItem]


class EnvironmentAnalysisResult(BaseModel):
    """Result from environment agent analysis"""
    audit_item_id: str
    applicable_forms: List[str]
    compliance_verdict: str
    key_fields_status: Dict[str, str]
    recommendations: List[str]
    full_analysis: str
    processing_timestamp: str
    agent: str = "EnvironmentAgent"


class AuditBatchResponse(BaseModel):
    """Response model for batch processing"""
    status: str
    batch_id: str
    session_id: str
    company_name: str
    location: str
    
    # Routing information
    agents_invoked: List[str]
    items_routed: Dict[str, int]  # agent_name -> count
    
    # Compliance metrics
    total_items_analyzed: int
    compliant_items: int
    non_compliant_items: int
    needs_review_items: int
    overall_compliance_score: float
    
    # Analysis details
    critical_findings: int
    high_risk_findings: int
    
    # Results per item
    analysis_results: List[Dict[str, Any]]
    
    # Recommendations
    recommendations: List[str]
    processing_timestamp: str


# ============================================
# ROUTING LOGIC
# ============================================

def should_route_to_environment_agent(
    audit_item: AuditItem
) -> bool:
    """
    Determine if audit item should be routed to environment agent.
    
    Routes to environment agent if:
    1. category contains 'environment' (case-insensitive), OR
    2. audit_item_id starts with 'ACT-RULE'
    
    Args:
        audit_item: The audit item to evaluate
        
    Returns:
        True if should route to environment agent
    """
    # Check category
    if "environment" in audit_item.category.lower():
        return True
    
    # Check audit_item_id prefix
    if audit_item.audit_item_id.startswith("ACT-RULE"):
        return True
    
    return False


def should_route_to_wages_agent(audit_item: AuditItem) -> bool:
    """
    DEPRECATED: Route to wages agent.
    
    This agent is currently commented out and not in use.
    Kept for documentation of Phase 2 migration path.
    """
    # if "wages" in audit_item.category.lower():
    #     return True
    # if audit_item.audit_item_id.startswith("CW-2019-SEC-"):
    #     return True
    return False


def should_route_to_safety_agent(audit_item: AuditItem) -> bool:
    """
    DEPRECATED: Route to occupational safety agent.
    
    This agent is currently commented out and not in use.
    Kept for documentation of Phase 2 migration path.
    """
    # if "safety" in audit_item.category.lower() or "occupational" in audit_item.category.lower():
    #     return True
    # if audit_item.audit_item_id.startswith("OSHWC-SEC-"):
    #     return True
    return False


def route_audit_item(audit_item: AuditItem) -> tuple[str, Any]:
    """
    Route audit item to appropriate specialist agent.
    
    Args:
        audit_item: The audit item to route
        
    Returns:
        Tuple of (agent_name, analysis_result)
    """
    logger.info(f"Routing audit item: {audit_item.audit_item_id}")
    
    try:
        # Route to environment agent
        if should_route_to_environment_agent(audit_item):
            logger.info(f"→ Routing to EnvironmentAgent: {audit_item.audit_item_id}")
            agent_payload = {
                "audit_queue": {
                    "audit_item_id": audit_item.audit_item_id,
                    "query": audit_item.question_text,
                    "evidence_text": f"{audit_item.intern_evidence or ''} {audit_item.evidence_url or ''}".strip(),
                    "context_data": {
                        "legal_text": audit_item.legal_text,
                        "risk_level": audit_item.risk_level,
                    },
                }
            }

            response = analyze_environment_query(agent_payload)

            if response.get("status") == "success":
                return ("EnvironmentAgent", response.get("final_report"))

            return ("EnvironmentAgent", {"error": response.get("error")})
        
        # Route to wages agent (DEPRECATED)
        elif should_route_to_wages_agent(audit_item):
            logger.info(f"✗ DEPRECATED: WagesAgent route (commented out): {audit_item.audit_item_id}")
            # result = analyze_wages_query(...)
            return ("WagesAgent", {"error": "WagesAgent is deprecated for this phase"})
        
        # Route to safety agent (DEPRECATED)
        elif should_route_to_safety_agent(audit_item):
            logger.info(f"✗ DEPRECATED: SafetyAgent route (commented out): {audit_item.audit_item_id}")
            # result = analyze_safety_query(...)
            return ("SafetyAgent", {"error": "SafetyAgent is deprecated for this phase"})
        
        # Unknown category
        else:
            logger.warning(f"⚠️  Unknown category/ID for routing: {audit_item.audit_item_id} ({audit_item.category})")
            return ("Unknown", {
                "error": f"No agent available for category '{audit_item.category}' or ID '{audit_item.audit_item_id}'",
                "audit_item_id": audit_item.audit_item_id
            })
    
    except Exception as e:
        logger.error(f"Error routing audit item {audit_item.audit_item_id}: {str(e)}")
        return ("Error", {"error": str(e), "audit_item_id": audit_item.audit_item_id})


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Audit Platform - Master Document Architecture",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "active_agents": ["EnvironmentAgent"],
        "deprecated_agents": ["WagesAgent (Phase 2)", "SafetyAgent (Phase 2)"]
    }


@app.post("/analyze-audit-item", response_model=Dict[str, Any], tags=["Analysis"])
async def analyze_single_audit_item(audit_item: AuditItem):
    """
    Analyze a single audit item using appropriate specialist agent.
    
    This endpoint automatically routes the item based on:
    - category field
    - audit_item_id prefix
    
    Returns the detailed analysis from the specialist agent.
    """
    try:
        logger.info(f"Received single audit item: {audit_item.audit_item_id}")
        
        agent_name, result = route_audit_item(audit_item)
        
        return {
            "audit_item_id": audit_item.audit_item_id,
            "agent": agent_name,
            "analysis": result,
            "processing_timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error analyzing audit item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/submit-audit-batch", response_model=AuditBatchResponse, tags=["Batch Processing"])
async def submit_audit_batch(request: AuditBatchRequest):
    """
    Process a complete audit batch using Master Document architecture.
    
    This endpoint:
    1. Routes each audit item to the appropriate specialist agent
    2. Collects analysis results
    3. Aggregates compliance metrics
    4. Provides comprehensive recommendations
    
    Routing Rules:
    - Environment: category contains 'environment' OR audit_item_id starts with 'ACT-RULE'
    - Wages: [DEPRECATED] category contains 'wages' OR audit_item_id starts with 'CW-2019-SEC-'
    - Safety: [DEPRECATED] category contains 'safety' OR audit_item_id starts with 'OSHWC-SEC-'
    """
    try:
        logger.info(f"Received batch submission: {request.batch_id}")
        logger.info(f"Company: {request.company_name}, Items: {len(request.audit_items)}")
        
        # Route each item
        analysis_results = []
        agents_invoked = set()
        items_by_agent = {}
        
        for audit_item in request.audit_items:
            logger.info(f"Processing item {len(analysis_results) + 1}/{len(request.audit_items)}")
            
            agent_name, result = route_audit_item(audit_item)
            agents_invoked.add(agent_name)
            items_by_agent[agent_name] = items_by_agent.get(agent_name, 0) + 1
            
            analysis_results.append({
                "audit_item_id": audit_item.audit_item_id,
                "question_text": audit_item.question_text,
                "risk_level": audit_item.risk_level,
                "agent": agent_name,
                "analysis": result
            })
        
        # Aggregate results
        compliant_items = sum(
            1 for r in analysis_results 
            if r["analysis"].get("compliance_verdict") == "Compliant"
        )
        non_compliant_items = sum(
            1 for r in analysis_results 
            if r["analysis"].get("compliance_verdict") == "Non-Compliant"
        )
        needs_review_items = sum(
            1 for r in analysis_results 
            if r["analysis"].get("compliance_verdict") == "Needs Review"
        )
        
        # Calculate compliance score
        total_items = len(request.audit_items)
        overall_compliance_score = (compliant_items / total_items * 100) if total_items > 0 else 0
        
        # Count findings
        critical_findings = sum(
            1 for r in analysis_results 
            if r["risk_level"] == "Critical" and r["analysis"].get("compliance_verdict") == "Non-Compliant"
        )
        high_risk_findings = sum(
            1 for r in analysis_results 
            if r["risk_level"] == "High" and r["analysis"].get("compliance_verdict") == "Non-Compliant"
        )
        
        # Collect all recommendations
        all_recommendations = []
        for result in analysis_results:
            if "recommendations" in result["analysis"]:
                all_recommendations.extend(result["analysis"]["recommendations"])
        
        # Remove duplicates and limit
        all_recommendations = list(set(all_recommendations))[:10]
        
        # Prepare response
        response = AuditBatchResponse(
            status="completed",
            batch_id=request.batch_id,
            session_id=request.session_id,
            company_name=request.company_name,
            location=request.location,
            agents_invoked=sorted(list(agents_invoked)),
            items_routed=items_by_agent,
            total_items_analyzed=total_items,
            compliant_items=compliant_items,
            non_compliant_items=non_compliant_items,
            needs_review_items=needs_review_items,
            overall_compliance_score=overall_compliance_score,
            critical_findings=critical_findings,
            high_risk_findings=high_risk_findings,
            analysis_results=analysis_results,
            recommendations=all_recommendations,
            processing_timestamp=datetime.now().isoformat()
        )
        
        logger.info(f"Batch {request.batch_id} processed successfully")
        logger.info(f"Overall Compliance Score: {overall_compliance_score:.1f}%")
        
        return response
    
    except Exception as e:
        logger.error(f"Error processing audit batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents/status", tags=["Administration"])
async def get_agents_status():
    """Get status of all specialist agents"""
    return {
        "timestamp": datetime.now().isoformat(),
        "active_agents": {
            "EnvironmentAgent": {
                "status": "active",
                "routes": [
                    "category contains 'environment'",
                    "audit_item_id starts with 'ACT-RULE'"
                ],
                "vector_store": "src/vector_stores/environment_index",
                "embeddings_model": "sentence-transformers/all-mpnet-base-v2"
            }
        },
        "deprecated_agents": {
            "WagesAgent": {
                "status": "deprecated",
                "phase": "Phase 2 Migration",
                "reason": "Temporarily commented out for testing"
            },
            "SafetyAgent": {
                "status": "deprecated",
                "phase": "Phase 2 Migration",
                "reason": "Temporarily commented out for testing"
            }
        }
    }


# ============================================
# DEPRECATED AGENT ROUTES (COMMENTED OUT)
# ============================================

# @app.post("/analyze-wages-query", tags=["Deprecated"])
# async def analyze_wages(audit_item: AuditItem):
#     """
#     DEPRECATED: This endpoint is no longer in use.
#     Use /analyze-audit-item or /submit-audit-batch instead.
#     """
#     # result = analyze_wages_query(...)
#     raise HTTPException(status_code=410, detail="This endpoint is deprecated. Use the routing endpoints instead.")


# @app.post("/analyze-safety-query", tags=["Deprecated"])
# async def analyze_safety(audit_item: AuditItem):
#     """
#     DEPRECATED: This endpoint is no longer in use.
#     Use /analyze-audit-item or /submit-audit-batch instead.
#     """
#     # result = analyze_safety_query(...)
#     raise HTTPException(status_code=410, detail="This endpoint is deprecated. Use the routing endpoints instead.")


# ============================================
# ERROR HANDLING
# ============================================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "status": "error",
        "message": str(exc),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print("Audit Platform - Master Document Architecture API")
    print("=" * 70)
    print("\nStarting server...")
    print("Available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("\nActive Agents:")
    print("  ✓ EnvironmentAgent (Routes: category='environment', ID prefix='ACT-RULE')")
    print("\nDeprecated Agents (Phase 2):")
    print("  ✗ WagesAgent (commented out)")
    print("  ✗ SafetyAgent (commented out)")
    print("\nEndpoints:")
    print("  POST /submit-audit-batch       - Process audit batch")
    print("  POST /analyze-audit-item       - Single item analysis")
    print("  GET  /agents/status            - Check agent status")
    print("  GET  /                         - Health check")
    print("=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
