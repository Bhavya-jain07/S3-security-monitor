import React, { useState } from "react";
import { RefreshCw, Settings, Bell, Search } from "lucide-react";

export default function Header({ onRefresh, loading }) {
  const [isRefreshHovered, setIsRefreshHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                S3 Security Dashboard
              </h1>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-semibold ring-1 ring-blue-400/20">
                Beta
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search buckets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                          text-gray-300 placeholder-gray-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onRefresh}
                onMouseEnter={() => setIsRefreshHovered(true)}
                onMouseLeave={() => setIsRefreshHovered(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-lg 
                          transition-all duration-300 hover:bg-blue-500/20 group"
              >
                <RefreshCw
                  className={`w-4 h-4 text-blue-400 transition-all duration-300 
                            ${loading ? "animate-spin" : ""} 
                            ${isRefreshHovered ? "scale-110" : ""}`}
                />
                <span className="text-blue-400 font-medium">Refresh</span>
              </button>

              <button className="relative p-2 text-gray-400 hover:text-gray-300 
                               transition-colors duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-300 
                               transition-colors duration-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
