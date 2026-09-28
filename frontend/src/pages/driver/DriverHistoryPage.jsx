import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { poolsApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { ArrowRight, ChevronRight, Users } from "lucide-react";

export default function DriverHistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pools", "history"],
    queryFn: () => poolsApi.getHistory().then((r) => r.data.pools),
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your completed and cancelled pools.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading history…" />}
        {isError && (
          <ErrorState
            message="Could not load trip history."
            onRetry={refetch}
          />
        )}
        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState
            title="No trips yet"
            description="Completed and cancelled pools will appear here."
          />
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((pool) => {
              const rides = pool.rideRequests ?? [];
              const firstRide = rides[0];
              const totalFare = rides.reduce(
                (s, r) => s + (r.fare?.total ?? 0),
                0
              );
              return (
                <div
                  key={pool.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {firstRide && (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 flex-wrap">
                          <span>{firstRide.pickupLocation?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{firstRide.destinationLocation?.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>
                          {new Date(pool.createdAt).toLocaleDateString("en-BD", {
                            dateStyle: "medium",
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{rides.length} ride{rides.length !== 1 ? "s" : ""}</span>
                        </div>
                        {totalFare > 0 && (
                          <span className="font-semibold text-gray-600">
                            ৳{totalFare} total
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={pool.status} />
                      <Link
                        to={`/driver/pools/${pool.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
