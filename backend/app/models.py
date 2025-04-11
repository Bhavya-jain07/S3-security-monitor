from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class SecurityStatus(str, Enum):
    SECURE = "Secure"
    INSECURE = "Insecure"

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class BucketFinding(BaseModel):
    bucket_name: str
    status: SecurityStatus
    last_checked: datetime
    severity: SeverityLevel
    description: str
    finding_id: str