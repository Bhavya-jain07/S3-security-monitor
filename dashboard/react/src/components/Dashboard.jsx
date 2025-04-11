import React from "react";
import PropTypes from 'prop-types';
import { RefreshCw } from "lucide-react";
import BucketCard from "./BucketCard";
import ErrorBoundary from "./ErrorBoundary";

export default function Dashboard({ buckets, loading, error, onUpdate }) {
  // Add debugging to see what data is being received
  console.log('Buckets received in Dashboard:', buckets);

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-xl p-6 text-red-200 animate-fade-in">
        <h3 className="text-lg font-medium">Error Loading Data</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-gray-400">Loading bucket information...</p>
      </div>
    );
  }

  if (!buckets || !Array.isArray(buckets) || buckets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center animate-bounce-in">
        <h3 className="text-lg font-medium text-gray-200">No Buckets Found</h3>
        <p className="mt-2 text-gray-400">
          No S3 buckets are currently being monitored.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buckets.map((bucket, index) => (
        <div
          key={bucket.bucket_name || index}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <ErrorBoundary>
            <BucketCard bucket={bucket} onUpdate={onUpdate} />
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}

Dashboard.propTypes = {
  buckets: PropTypes.arrayOf(
    PropTypes.shape({
      bucket_name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['Secure', 'Insecure']).isRequired,
      severity: PropTypes.oneOf(['LOW', 'MEDIUM', 'HIGH']).isRequired,
      issues: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onUpdate: PropTypes.func.isRequired
}
