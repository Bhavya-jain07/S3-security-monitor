import React, { useState, useEffect } from "react";
import { securityApi } from "./services/api";
import Dashboard from "./components/Dashboard";
import SecurityStats from "./components/SecurityStats";
import Header from "./components/Header";
import { toast } from "react-hot-toast";

export default function App() {
  const [buckets, setBuckets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchData = async (retryAttempt = 0) => {
    try {
      setLoading(true);
      const [findingsResponse, statsResponse] = await Promise.all([
        securityApi.getFindings(),
        securityApi.getStats()
      ]);

      console.log('API Response:', findingsResponse); // Debug log

      // Ensure the data matches the expected format
      const formattedFindings = findingsResponse.map(finding => ({
        bucket_name: finding.bucket_name,
        status: finding.status,
        severity: finding.severity || (finding.status === 'Secure' ? 'LOW' : 'HIGH'),
        issues: finding.issues || [],
      }));

      console.log('Formatted Findings:', formattedFindings); // Debug log
      setBuckets(formattedFindings);
      setStats(statsResponse);
      setLastChecked(new Date());
      setError(null);

      if (formattedFindings.length === 0) {
        toast.info("No buckets found in your AWS account");
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch bucket information');
      
      // Retry logic for transient errors
      if (retryAttempt < 3) {
        setTimeout(() => fetchData(retryAttempt + 1), 1000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <Header onRefresh={fetchData} loading={loading} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Security Overview</h2>
          {lastChecked && (
            <p className="text-sm text-gray-400">
              Last updated: {new Date(lastChecked).toLocaleString()}
            </p>
          )}
        </div>

        {stats && <SecurityStats stats={stats} />}
        
        <Dashboard 
          buckets={buckets}
          loading={loading}
          error={error}
          onUpdate={fetchData}
        />
      </main>
    </div>
  );
}











