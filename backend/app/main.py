from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Any
import logging
from .services.aws_service import aws_service

# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="S3 Security API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint to verify API is running"""
    return {"message": "S3 Security API is running"}

@app.get("/api/findings", response_model=List[Dict[str, Any]])
async def get_findings():
    """Get security findings for all buckets"""
    try:
        findings = await aws_service.get_findings()
        logger.info(f"Retrieved findings for {len(findings)} buckets")
        return findings
    except Exception as e:
        logger.error(f"Error getting findings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Test endpoint to verify AWS connectivity
@app.get("/api/test-connection")
async def test_connection():
    """Test AWS connectivity and permissions"""
    try:
        buckets = await aws_service.list_buckets()
        return {
            "status": "success",
            "message": "Successfully connected to AWS",
            "buckets": buckets
        }
    except Exception as e:
        logger.error(f"AWS connection test failed: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

class RemediationRequest(BaseModel):
    bucket_name: str = Field(..., min_length=1)
    actions: List[Literal["enable_encryption", "block_public_access"]]

@app.post("/api/remediate")
async def remediate_bucket(request: RemediationRequest):
    try:
        logger.info(f"Remediating bucket {request.bucket_name} with actions: {request.actions}")
        results = []
        
        for action in request.actions:
            try:
                if action == "enable_encryption":
                    await aws_service.enable_bucket_encryption(request.bucket_name)
                    results.append({"action": action, "status": "success"})
                elif action == "block_public_access":
                    await aws_service.enable_public_access_block(request.bucket_name)
                    results.append({"action": action, "status": "success"})
                else:
                    results.append({
                        "action": action,
                        "status": "error",
                        "message": "Unknown action"
                    })
            except Exception as e:
                logger.error(f"Error performing action {action}: {str(e)}")
                results.append({
                    "action": action,
                    "status": "error",
                    "message": str(e)
                })
        
        return {
            "bucket_name": request.bucket_name,
            "results": results,
            "message": "Remediation actions completed"
        }
    except Exception as e:
        logger.error(f"Error in remediation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get security statistics for all buckets"""
    try:
        stats = await aws_service.get_stats()
        logger.info("Retrieved security stats successfully")
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class StorageClassRequest(BaseModel):
    bucket_name: str = Field(..., min_length=1)
    storage_class: Literal[
        'STANDARD',
        'REDUCED_REDUNDANCY',
        'STANDARD_IA',
        'ONEZONE_IA',
        'INTELLIGENT_TIERING',
        'GLACIER',
        'DEEP_ARCHIVE',
        'GLACIER_IR'
    ]

@app.post("/api/storage-class")
async def change_storage_class(request: StorageClassRequest):
    """Change storage class for a bucket"""
    try:
        result = await aws_service.change_storage_class(
            request.bucket_name,
            request.storage_class
        )
        return result
    except Exception as e:
        logger.error(f"Error changing storage class: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to change storage class: {str(e)}"
        )

@app.get("/api/bucket/{bucket_name}/storage")
async def get_bucket_storage_info(bucket_name: str):
    """Get storage class information for a bucket"""
    try:
        result = await aws_service.get_bucket_security_status(bucket_name)
        return {
            "bucket_name": bucket_name,
            "storage_classes": result.get("storage_classes", ["STANDARD"])
        }
    except Exception as e:
        logger.error(f"Error getting storage info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get storage information: {str(e)}"
        )




