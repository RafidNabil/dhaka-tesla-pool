import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { poolsApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { ArrowRight, Users, ChevronRight } from "lucide-react";

export default function MatchingPoolsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pools", "matching"],
    queryFn: () => poolsApi.getMatching().then((r) => r.data.pools),
    refetchInterval: 15000,
  });

  const matchingPools =
    data?.filter((pool) => {
      const rides = pool.rideRequests ?? [];
      return (
        pool.status !== "CANCELLED" &&
        rides.some((r) => r.status !== "CANCELLED")
      );
    }) ?? [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matching Pools</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pools currently looking for a driver. Refreshes every 15s.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading matching pools…" />}
        {isError && (
          <ErrorState
            message="Could not load matching pools."
            onRetry={refetch}
          />
        )}
        {!isLoading && !isError && matchingPools.length === 0 && (
          <EmptyState
            title="No matching pools"
            description="There are no pools seeking a driver right now."
          />
        )}

        {matchingPools.length > 0 && (
          <div className="space-y-3">
            {matchingPools.map((pool) => {
              const rides = pool.rideRequests ?? [];
              const firstRide = rides.find((r) => r.status !== "CANCELLED") ?? rides[0];
              const activeRides = rides.filter((r) => r.status !== "CANCELLED");
              return (
                <div
                  key={pool.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-400">
                        Pool {pool.id.slice(0, 8)}…
                      </p>
                      {firstRide && (
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mt-1 flex-wrap">
                          <span>{firstRide.pickupLocation?.name}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{firstRide.destinationLocation?.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {activeRides.length} ride{activeRides.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span>·</span>
                        <span>{pool.seatsOccupied} seat{pool.seatsOccupied !== 1 ? "s" : ""} occupied</span>
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
