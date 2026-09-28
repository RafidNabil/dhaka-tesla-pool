import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ridesApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function PassengerHistoryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["rides", "history"],
    queryFn: () => ridesApi.getHistory().then((r) => r.data.rides),
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your completed and cancelled rides.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading history…" />}
        {isError && (
          <ErrorState message="Could not load ride history." onRetry={refetch} />
        )}
        {!isLoading && !isError && data?.length === 0 && (
          <EmptyState
            title="No rides yet"
            description="Your completed and cancelled rides will appear here."
          />
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Route */}
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 flex-wrap">
                      <span>{ride.pickupLocation.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{ride.destinationLocation.name}</span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>
                        {new Date(ride.requestedAt).toLocaleDateString("en-BD", {
                          dateStyle: "medium",
                        })}
                      </span>
                      <span>{ride.seatsRequested} seat{ride.seatsRequested > 1 ? "s" : ""}</span>
                      {ride.fare && (
                        <span className="font-semibold text-gray-600">
                          ৳{ride.fare.total}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={ride.status} />
                    <Link
                      to={`/passenger/rides/${ride.id}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
