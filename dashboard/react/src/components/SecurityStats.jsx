import React from "react";
import { Shield, AlertTriangle, Database, TrendingUp, AlertOctagon } from "lucide-react";

export default function SecurityStats({ stats }) {
  if (!stats) return null;

  const {
    security_score = 0,
    secure_buckets = 0,
    total_buckets = 0,
    insecure_buckets = total_buckets - secure_buckets
  } = stats;

  const statCards = [
    {
      title: "Security Score",
      value: `${security_score}%`,
      icon: Shield,
      color: security_score >= 70 ? "text-green-400" : "text-red-400",
      bgColor: security_score >= 70 ? "bg-green-500/10" : "bg-red-500/10"
    },
    {
      title: "Total Buckets",
      value: total_buckets,
      icon: Database,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Secure Buckets",
      value: secure_buckets,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Insecure Buckets",
      value: insecure_buckets,
      icon: AlertOctagon,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      description: insecure_buckets > 0 ? "Requires attention" : "All buckets secure"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="bg-gray-900/50 backdrop-blur-sm backdrop-filter
                     border border-gray-800 rounded-xl p-6
                     transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{card.title}</p>
              <p className={`text-3xl font-bold mt-2 ${card.color}`}>
                {card.value}
              </p>
              {card.description && (
                <p className="text-sm mt-2 text-gray-500">
                  {card.description}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
