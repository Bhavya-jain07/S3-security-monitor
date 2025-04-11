import asyncio
from concurrent.futures import ThreadPoolExecutor
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class AWSService:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.executor = ThreadPoolExecutor(max_workers=10)  # Limit concurrent AWS calls

    async def get_bucket_security_status(self, bucket_name: str):
        """Check security status of a single bucket"""
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.executor,
                self._check_bucket_security,
                bucket_name
            )
        except Exception as e:
            logger.error(f"Error checking bucket {bucket_name}: {str(e)}")
            return {
                "bucket_name": bucket_name,
                "issues": [f"Error checking security: {str(e)}"],
                "is_secure": False,
                "severity": "HIGH"
            }

    def _check_bucket_security(self, bucket_name: str):
        """Internal method to check bucket security and storage class"""
        issues = []
        storage_info = {}
        
        try:
            # Get bucket objects to check storage classes
            paginator = self.s3.get_paginator('list_objects_v2')
            storage_classes = set()
            
            for page in paginator.paginate(Bucket=bucket_name):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        storage_classes.add(obj.get('StorageClass', 'STANDARD'))

            storage_info['storage_classes'] = list(storage_classes)

            # Existing security checks
            try:
                self.s3.get_bucket_encryption(Bucket=bucket_name)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                    issues.append("Encryption not enabled")
                elif e.response['Error']['Code'] != 'NoSuchBucketPolicy':
                    raise e

            # Check public access block
            try:
                public_access = self.s3.get_public_access_block(Bucket=bucket_name)
                block_config = public_access['PublicAccessBlockConfiguration']
                if not all(block_config.values()):
                    issues.append("Public access not fully blocked")
            except ClientError:
                issues.append("Public access block not configured")

            # Determine severity based on issues
            severity = "LOW" if not issues else ("HIGH" if len(issues) > 1 else "MEDIUM")

            return {
                "bucket_name": bucket_name,
                "issues": issues,
                "is_secure": len(issues) == 0,
                "severity": severity,
                "status": "Secure" if len(issues) == 0 else "Insecure",
                "storage_classes": storage_info['storage_classes']
            }

        except Exception as e:
            logger.error(f"Error in _check_bucket_security for {bucket_name}: {str(e)}")
            raise

    async def get_stats(self):
        """Get security statistics for all buckets"""
        try:
            # Get list of all buckets
            response = self.s3.list_buckets()
            buckets = response.get('Buckets', [])
            
            total_buckets = len(buckets)
            secure_buckets = 0
            insecure_buckets = 0

            for bucket in buckets:
                status = await self.get_bucket_security_status(bucket['Name'])
                if status['is_secure']:
                    secure_buckets += 1
                else:
                    insecure_buckets += 1

            return {
                'total_buckets': total_buckets,
                'secure_buckets': secure_buckets,
                'insecure_buckets': insecure_buckets,
                'security_score': round((secure_buckets / total_buckets * 100) if total_buckets > 0 else 0, 2)
            }
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            raise

    async def get_findings(self):
        """Get security findings for all buckets"""
        try:
            response = self.s3.list_buckets()
            buckets = response.get('Buckets', [])
            
            # Process buckets in parallel with a limit
            tasks = []
            for bucket in buckets:
                task = self.get_bucket_security_status(bucket['Name'])
                tasks.append(task)
            
            # Wait for all tasks to complete with timeout
            findings = await asyncio.gather(*tasks, return_exceptions=True)
            
            return [
                {
                    'bucket_name': finding['bucket_name'],
                    'status': 'Secure' if finding['is_secure'] else 'Insecure',
                    'severity': finding['severity'],  # Make sure severity is included
                    'issues': finding['issues'],
                    'last_checked': bucket['CreationDate'].isoformat()
                }
                for finding, bucket in zip(findings, buckets)
                if not isinstance(finding, Exception)
            ]
            
        except Exception as e:
            logger.error(f"Error getting findings: {str(e)}")
            raise

    async def enable_bucket_encryption(self, bucket_name: str):
        """Enable default encryption for a bucket"""
        try:
            self.s3.put_bucket_encryption(
                Bucket=bucket_name,
                ServerSideEncryptionConfiguration={
                    'Rules': [
                        {
                            'ApplyServerSideEncryptionByDefault': {
                                'SSEAlgorithm': 'AES256'
                            }
                        }
                    ]
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error enabling encryption for bucket {bucket_name}: {str(e)}")
            raise

    async def enable_public_access_block(self, bucket_name: str):
        """Block all public access for a bucket"""
        try:
            self.s3.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error blocking public access for bucket {bucket_name}: {str(e)}")
            raise

    async def change_storage_class(self, bucket_name: str, new_storage_class: str):
        """Change storage class for objects in a bucket"""
        valid_storage_classes = [
            'STANDARD',
            'REDUCED_REDUNDANCY',
            'STANDARD_IA',
            'ONEZONE_IA',
            'INTELLIGENT_TIERING',
            'GLACIER',
            'DEEP_ARCHIVE',
            'GLACIER_IR'
        ]

        if new_storage_class not in valid_storage_classes:
            raise ValueError(f"Invalid storage class. Must be one of: {', '.join(valid_storage_classes)}")

        try:
            paginator = self.s3.get_paginator('list_objects_v2')
            for page in paginator.paginate(Bucket=bucket_name):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        self.s3.copy_object(
                            Bucket=bucket_name,
                            CopySource={'Bucket': bucket_name, 'Key': obj['Key']},
                            Key=obj['Key'],
                            StorageClass=new_storage_class
                        )
            
            return {
                "status": "success",
                "message": f"Storage class changed to {new_storage_class}",
                "bucket_name": bucket_name
            }
        except Exception as e:
            logger.error(f"Error changing storage class for bucket {bucket_name}: {str(e)}")
            raise

# Create a singleton instance
aws_service = AWSService()







