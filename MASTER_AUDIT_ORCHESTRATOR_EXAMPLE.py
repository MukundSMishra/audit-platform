"""
Master Audit Orchestrator - Example Implementation for Universal_Subject_Expert_Agent

This module demonstrates how to implement run_master_audit() function
that routes Code on Wages and OSH Code items to specialist agents

Installation:
pip install fastapi uvicorn pydantic python-dateutil

Usage:
Copy this code into your src/api.py file in the Universal_Subject_Expert_Agent project
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC MODELS
# ============================================

class AuditItemRequest(BaseModel):
    audit_item_id: str
    question_text: str
    legal_text: str
    risk_level: str
    category: str
    workflow_type: str
    intern_verdict: Optional[str] = None
    intern_comment: Optional[str] = None
    evidence_url: Optional[str] = None
    intern_evidence: Optional[str] = None
    missing_evidence_reason: Optional[str] = None
    applicability_reason: Optional[str] = None
    is_applicable: bool = True


class MasterAuditRequest(BaseModel):
    batch_id: str
    session_id: str
    company_name: str
    location: str
    submitted_at: str
    audit_items: List[AuditItemRequest]


class ActComplianceScore(BaseModel):
    score: float
    critical: int
    high: int
    items_analyzed: int


class MasterAuditResponse(BaseModel):
    batch_id: str
    session_id: str
    company_name: str
    location: str
    submitted_at: str
    
    # Compliance breakdown
    act_scores: Dict[str, ActComplianceScore]
    overall_compliance_score: float
    
    # Findings
    total_findings: int
    critical_findings: int
    high_risk_findings: int
    medium_risk_findings: int
    low_risk_findings: int
    
    # Details
    findings: List[Dict[str, Any]]
    recommendations: List[str]
    agents_invoked: List[str]
    processing_timestamp: str


# ============================================
# MASTER AUDIT ORCHESTRATOR
# ============================================

def partition_audit_items(audit_items: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Partition audit items by their ID prefix to route to appropriate agents
    
    Returns:
        {
            'wages': [...],      # CW-2019-SEC- prefixed items
            'safety': [...],     # OSHWC-SEC- prefixed items
            'other': [...]       # All others
        }
    """
    partitions = {
        'wages': [],
        'safety': [],
        'other': []
    }
    
    for item in audit_items:
        item_id = item.get('audit_item_id', '')
        
        if item_id.startswith('CW-2019-SEC-'):
            partitions['wages'].append(item)
            logger.info(f"📄 Routed to Wages Agent: {item_id}")
        
        elif item_id.startswith('OSHWC-SEC-'):
            partitions['safety'].append(item)
            logger.info(f"🛡️  Routed to Safety Agent: {item_id}")
        
        else:
            partitions['other'].append(item)
            logger.info(f"❓ Unknown prefix: {item_id}")
    
    return partitions


def invoke_specialist_agent(
    agent_name: str,
    items: List[Dict],
    context: Dict
) -> Optional[Dict]:
    """
    Invoke specialist agent (wages_expert, safety_expert, etc.)
    
    This is a mock implementation. Replace with actual agent invocation.
    In production, this would call your agent framework.
    """
    
    if not items:
        return None
    
    logger.info(f"\n🚀 Invoking {agent_name}...")
    logger.info(f"   Items to analyze: {len(items)}")
    
    # ================================================================
    # TODO: Replace this with actual agent invocation
    # Example: result = call_agent_framework(agent_name, items, context)
    # ================================================================
    
    # Mock response for demonstration
    critical_count = sum(1 for item in items if item.get('risk_level') == 'Critical')
    high_count = sum(1 for item in items if item.get('risk_level') == 'High')
    non_compliant = sum(1 for item in items if item.get('intern_verdict') == 'Non-Compliant')
    
    # Simple scoring: deduct points for non-compliance
    base_score = 100
    penalty_per_critical = 15
    penalty_per_high = 8
    penalty_per_non_compliant = 5
    
    score = base_score - (critical_count * penalty_per_critical) - (high_count * penalty_per_high) - (non_compliant * penalty_per_non_compliant)
    score = max(0, min(100, score))  # Clamp between 0-100
    
    result = {
        'agent_name': agent_name,
        'overall_compliance_score': score,
        'critical_findings': critical_count,
        'high_risk_findings': high_count,
        'medium_risk_findings': 0,
        'low_risk_findings': 0,
        'analyzed_items': len(items),
        'findings': [
            {
                'item_id': item.get('audit_item_id'),
                'status': item.get('intern_verdict', 'Not Assessed'),
                'category': item.get('category'),
                'severity': item.get('risk_level'),
                'comment': item.get('intern_comment', ''),
                'recommendation': f"Review {item.get('category')} compliance for {context.get('company_name')}"
            }
            for item in items
        ],
        'recommendations': [
            f"Address {len([i for i in items if i.get('intern_verdict') == 'Non-Compliant'])} non-compliance findings",
            f"Focus on {critical_count} critical items" if critical_count > 0 else None,
            f"Improve {high_count} high-risk areas" if high_count > 0 else None
        ]
    }
    
    # Filter out None recommendations
    result['recommendations'] = [r for r in result['recommendations'] if r is not None]
    
    logger.info(f"   ✅ Score: {score}%")
    logger.info(f"   📊 Findings: {len(result['findings'])} items analyzed")
    
    return result


def synthesize_results(
    batch_data: Dict,
    wages_results: Optional[Dict] = None,
    safety_results: Optional[Dict] = None
) -> Dict:
    """
    Synthesize results from specialist agents into unified report
    Handles cases where only one act was audited
    """
    
    logger.info("\n🔀 Synthesizing results...")
    
    # Build act_scores dictionary
    act_scores = {}
    all_findings = []
    all_recommendations = []
    total_critical = 0
    total_high = 0
    total_medium = 0
    total_low = 0
    
    # === Extract Wages Results ===
    if wages_results:
        act_scores['Code on Wages, 2019'] = {
            'score': wages_results.get('overall_compliance_score', 0),
            'critical': wages_results.get('critical_findings', 0),
            'high': wages_results.get('high_risk_findings', 0),
            'items_analyzed': wages_results.get('analyzed_items', 0)
        }
        all_findings.extend(wages_results.get('findings', []))
        all_recommendations.extend(wages_results.get('recommendations', []))
        
        total_critical += wages_results.get('critical_findings', 0)
        total_high += wages_results.get('high_risk_findings', 0)
        total_medium += wages_results.get('medium_risk_findings', 0)
        total_low += wages_results.get('low_risk_findings', 0)
        
        logger.info(f"💰 Wages Expert: {wages_results.get('overall_compliance_score', 0)}%")
    
    # === Extract Safety Results ===
    if safety_results:
        act_scores['OSH Code, 2020'] = {
            'score': safety_results.get('overall_compliance_score', 0),
            'critical': safety_results.get('critical_findings', 0),
            'high': safety_results.get('high_risk_findings', 0),
            'items_analyzed': safety_results.get('analyzed_items', 0)
        }
        all_findings.extend(safety_results.get('findings', []))
        all_recommendations.extend(safety_results.get('recommendations', []))
        
        total_critical += safety_results.get('critical_findings', 0)
        total_high += safety_results.get('high_risk_findings', 0)
        total_medium += safety_results.get('medium_risk_findings', 0)
        total_low += safety_results.get('low_risk_findings', 0)
        
        logger.info(f"🛡️  Safety Expert: {safety_results.get('overall_compliance_score', 0)}%")
    
    # === Compute Overall Score ===
    scores = [s['score'] for s in act_scores.values()]
    if len(scores) > 1:
        overall_score = sum(scores) / len(scores)
    elif len(scores) == 1:
        overall_score = scores[0]
    else:
        overall_score = 0
    
    logger.info(f"📊 Overall Score: {overall_score}%")
    
    # === Build Final Report ===
    final_report = {
        'batch_id': batch_data.get('batch_id'),
        'session_id': batch_data.get('session_id'),
        'company_name': batch_data.get('company_name'),
        'location': batch_data.get('location'),
        'submitted_at': batch_data.get('submitted_at'),
        
        # Compliance Breakdown
        'act_scores': act_scores,
        'overall_compliance_score': round(overall_score, 2),
        
        # Findings Summary
        'total_findings': len(all_findings),
        'critical_findings': total_critical,
        'high_risk_findings': total_high,
        'medium_risk_findings': total_medium,
        'low_risk_findings': total_low,
        
        # Detailed Results
        'findings': all_findings,
        'recommendations': list(set(all_recommendations)),  # Deduplicate
        
        # Metadata
        'agents_invoked': list(act_scores.keys()),
        'processing_timestamp': datetime.now().isoformat()
    }
    
    logger.info(f"✨ Report Ready: {final_report['total_findings']} findings, {len(final_report['recommendations'])} recommendations")
    
    return final_report


def run_master_audit(batch_data: Dict) -> Dict:
    """
    Master orchestrator for multi-act audits
    
    1. Partitions items by ID prefix (CW-2019-SEC- vs OSHWC-SEC-)
    2. Routes to appropriate specialist agents
    3. Synthesizes results into unified report
    
    Args:
        batch_data: {
            'batch_id': str,
            'session_id': str,
            'company_name': str,
            'location': str,
            'audit_items': [...]
        }
    
    Returns:
        Unified audit report with all findings and recommendations
    """
    
    logger.info("=" * 60)
    logger.info(f"🚀 MASTER AUDIT ORCHESTRATOR - Starting")
    logger.info(f"   Batch ID: {batch_data.get('batch_id')}")
    logger.info(f"   Company: {batch_data.get('company_name')}")
    logger.info(f"   Items: {len(batch_data.get('audit_items', []))}")
    logger.info("=" * 60)
    
    # Step 1: Partition items
    partitions = partition_audit_items(batch_data.get('audit_items', []))
    
    logger.info(f"\n📊 Partition Summary:")
    logger.info(f"   💰 Wages items: {len(partitions['wages'])}")
    logger.info(f"   🛡️  Safety items: {len(partitions['safety'])}")
    logger.info(f"   ❓ Other items: {len(partitions['other'])}")
    
    # Step 2: Invoke specialist agents
    wages_results = None
    safety_results = None
    
    if partitions['wages']:
        wages_results = invoke_specialist_agent(
            agent_name='wages_expert',
            items=partitions['wages'],
            context={
                'batch_id': batch_data.get('batch_id'),
                'company_name': batch_data.get('company_name'),
                'location': batch_data.get('location')
            }
        )
    
    if partitions['safety']:
        safety_results = invoke_specialist_agent(
            agent_name='safety_expert',
            items=partitions['safety'],
            context={
                'batch_id': batch_data.get('batch_id'),
                'company_name': batch_data.get('company_name'),
                'location': batch_data.get('location')
            }
        )
    
    # Step 3: Synthesize results
    final_report = synthesize_results(
        batch_data=batch_data,
        wages_results=wages_results,
        safety_results=safety_results
    )
    
    logger.info("=" * 60)
    logger.info("✅ MASTER AUDIT COMPLETE")
    logger.info("=" * 60)
    
    return final_report


# ============================================
# FASTAPI ENDPOINTS
# ============================================

# (Add this to your existing FastAPI app)

@app.post("/run-master-audit", response_model=MasterAuditResponse)
async def run_master_audit_endpoint(request: MasterAuditRequest):
    """
    Main orchestrator endpoint for multi-act audits
    
    Routes items to specialist agents based on ID prefix:
    - CW-2019-SEC-* → wages_expert
    - OSHWC-SEC-* → safety_expert
    
    Returns unified report with merged findings and recommendations
    """
    try:
        batch_dict = request.dict()
        result = run_master_audit(batch_dict)
        return MasterAuditResponse(**result)
    except Exception as e:
        logger.error(f"❌ Error in master audit: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/invoke-agent")
async def invoke_agent_router(work_order: Dict):
    """
    Universal agent router - determines which agent to invoke
    
    If agent_id is "master" or "universal", routes to master audit
    """
    try:
        agent_id = work_order.get('agent_id', '')
        
        if agent_id in ['master', 'universal', 'master_audit']:
            # Extract batch data from work order payload
            payload = work_order.get('payload', {})
            result = run_master_audit(payload)
            
            return {
                'status': 'success',
                'agent_id': 'master_audit',
                'batch_id': result.get('batch_id'),
                'report': result
            }
        else:
            # Route to other agents
            return {
                'status': 'error',
                'error': f"Unknown agent: {agent_id}"
            }
    
    except Exception as e:
        logger.error(f"❌ Agent router error: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
