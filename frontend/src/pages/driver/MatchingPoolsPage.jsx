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
  const { data: pool, isLoading, isError, refetch } = useQuery({
    queryKey: ["pools", "active"],
    queryFn: () => poolsApi.getActive().then((r) => r.data.pool),
    refetchInterval: 15000,
  });

  const rides = pool?.rideRequests ?? [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Current Pool</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your assigned pool and its current ride status.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading current pool…" />}
        {isError && (
          <ErrorState
            message="Could not load your current pool."
            onRetry={refetch}
          />
        )}
        {!isLoading && !isError && !pool && (
          <EmptyState
            title="No current pool"
            description="Accept a pool offer to see your assigned ride here."
          />
        )}

        {!isLoading && !isError && pool && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-gray-400">
                    Pool {pool.id.slice(0, 8)}…
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {rides.length} ride{rides.length !== 1 ? "s" : ""} · {pool.seatsOccupied} seat{pool.seatsOccupied !== 1 ? "s" : ""} occupied
                  </p>
                </div>
                <StatusBadge status={pool.status} />
              </div>
            </div>

            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 flex-wrap">
                      <span>{ride.pickupLocation?.name}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{ride.destinationLocation?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ride.seatsRequested} seat{ride.seatsRequested !== 1 ? "s" : ""}</span>
                      {ride.fare && <span>· ৳{ride.fare.total}</span>}
                    </div>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>
              </div>
            ))}

            <Link
              to={`/driver/pools/${pool.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
            >
              Open pool actions
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
