import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Shield, AlertTriangle, Clock, RefreshCw, ChevronRight, Lock, Globe } from "lucide-react";
import { securityApi } from "../services/api";
import PropTypes from 'prop-types';

export default function BucketCard({ bucket, onUpdate }) {
  console.log('Bucket data received:', bucket);
  const bucketData = {
    bucket_name: bucket?.bucket_name || 'Unknown Bucket',
    status: bucket?.status || 'Insecure',
    severity: bucket?.severity || 'HIGH',
    issues: bucket?.issues || []
  };

  const [remediating, setRemediating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRemediate = async () => {
    setRemediating(true);
    try {
      const remediationActions = [];
      bucketData.issues.forEach(issue => {
        if (issue.toLowerCase().includes('encryption')) {
          remediationActions.push('enable_encryption');
        }
        if (issue.toLowerCase().includes('public') || issue.toLowerCase().includes('access')) {
          remediationActions.push('block_public_access');
        }
      });
      if (remediationActions.length > 0) {
        await securityApi.remediateBucket(bucketData.bucket_name, remediationActions);
        toast.success("Bucket secured successfully");
        onUpdate();
      } else {
        toast.warning("No remediation actions identified");
      }
    } catch (error) {
      toast.error(error.message || "Failed to secure bucket");
      console.error("Remediation error:", error);
    } finally {
      setRemediating(false);
    }
  };
  const severityConfig = {
    HIGH: {
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      icon: AlertTriangle
    },
    MEDIUM: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      icon: AlertTriangle
    },
    LOW: {
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      icon: Shield
    },
    DEFAULT: {
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
      icon: AlertTriangle
    }
  };

  // Get config with fallback to DEFAULT if severity doesn't match
  const config = severityConfig[bucketData.severity] || severityConfig.DEFAULT;
  const Icon = config.icon;

  return (
    <div className={`
      rounded-xl backdrop-blur-sm backdrop-filter
      border ${bucketData.status === "Secure" ? "border-green-500/20" : config.borderColor}
      bg-gray-900/50 overflow-hidden transition-all duration-300
      hover:shadow-lg hover:shadow-blue-500/5
    `}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-200">{bucketData.bucket_name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {bucketData.status === "Secure" ? "No issues detected" : `${bucketData.issues.length || 0} issues found`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${config.bgColor} ${config.color}
            `}>
              {bucketData.severity}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors duration-200"
            >
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform duration-200
                          ${isExpanded ? "transform rotate-90" : ""}`}
              />
            </button>
          </div>
        </div>

        {isExpanded && bucketData.issues && bucketData.issues.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              {bucketData.issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50"
                >
                  {issue.includes("encryption") ? (
                    <Lock className="w-4 h-4 text-gray-400 mt-0.5" />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-300">{issue}</span>
                </div>
              ))}
            </div>

            {bucketData.status !== "Secure" && (
              <button
                onClick={handleRemediate}
                disabled={remediating}
                className={`
                  w-full px-4 py-3 rounded-lg font-medium text-sm
                  transition-all duration-200 flex items-center justify-center space-x-2
                  ${remediating
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"}
                  text-white
                `}
              >
                {remediating && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{remediating ? "Securing bucket..." : "Secure Now"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Extract error state into a separate component
function InvalidBucketCard({ message }) {
  return (
    <div className="rounded-xl backdrop-blur-sm backdrop-filter border border-yellow-500/20 bg-gray-900/50 p-6">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <div>
          <h3 className="text-lg font-medium text-yellow-400">Invalid Bucket Data</h3>
          <p className="text-sm text-gray-400 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

BucketCard.propTypes = {
  bucket: PropTypes.shape({
    bucket_name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['Secure', 'Insecure']).isRequired,
    severity: PropTypes.oneOf(['LOW', 'MEDIUM', 'HIGH']).isRequired,
    issues: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onUpdate: PropTypes.func.isRequired
}
