import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 60000, // Increase default timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

export const securityApi = {
  getFindings: async () => {
    try {
      const response = await api.get('/findings');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  remediateBucket: async (bucketName, actions) => {
    try {
      // Validate input before sending
      if (!bucketName || !actions || !Array.isArray(actions) || actions.length === 0) {
        throw new Error('Invalid remediation request parameters');
      }

      // Ensure actions only contain valid values
      const validActions = actions.filter(action => 
        ['enable_encryption', 'block_public_access'].includes(action)
      );

      if (validActions.length === 0) {
        throw new Error('No valid remediation actions specified');
      }

      const response = await api.post('/remediate', {
        bucket_name: bucketName,
        actions: validActions
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        throw new Error('Invalid remediation request: ' + 
          (error.response.data.detail?.[0]?.msg || 'Validation error'));
      }
      handleApiError(error);
    }
  },

  getAllFindings: async (progressCallback) => {
    try {
      const response = await api.get('/findings');
      const findings = response.data;
      
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback(findings.length);
      }
      
      return findings;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// Centralized error handling
const handleApiError = (error) => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    throw new Error('The request took too long to complete. Please try again.');
  }
  if (error.response?.status === 404) {
    throw new Error('The requested resource was not found.');
  }
  if (error.response?.status === 503) {
    throw new Error('The service is currently unavailable. Please try again later.');
  }
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  if (error.response) {
    throw new Error('Server error occurred');
  }
  if (error.request) {
    throw new Error('Unable to reach the server. Please check your connection.');
  }
  throw error;
};

// Add specific error handling for S3 bucket operations
const handleBucketError = (error) => {
  if (error.response?.data?.detail) {
    throw new Error(`Bucket operation failed: ${error.response.data.detail}`);
  }
  if (error.response?.status === 403) {
    throw new Error('Permission denied. Please check your AWS credentials.');
  }
  if (error.response?.status === 404) {
    throw new Error('Bucket not found.');
  }
  // Fall back to general error handling
  handleApiError(error);
};

// Use this in your bucket-related API calls
export const getBucketStatus = async (bucketName) => {
  try {
    const response = await axios.get(`/api/buckets/${bucketName}/status`);
    return response.data;
  } catch (error) {
    handleBucketError(error);
  }
};

export default securityApi;
