import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { poolsApi } from "../../lib/api";
import {
  getSocket,
  joinPoolRoom,
  leavePoolRoom,
  connectSocket,
} from "../../lib/socket";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import StatusBadge from "../../components/StatusBadge";
import {
  ArrowRight,
  User,
  MapPin,
  CheckCircle,
  Play,
  Flag,
  Users,
  XCircle,
  Clock,
} from "lucide-react";

function ActionButton({ label, icon: Icon, onClick, disabled, variant = "primary" }) {
  const base =
    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
    green: "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

export default function PoolDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data: pool,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["pools", id],
    queryFn: () => poolsApi.getById(id).then((r) => r.data.pool),
    refetchInterval: (data) => {
      const allRides = data?.rideRequests ?? [];
      const allCancelled =
        allRides.length > 0 && allRides.every((r) => r.status === "CANCELLED");
      if (
        data?.status === "COMPLETED" ||
        data?.status === "CANCELLED" ||
        allCancelled
      ) {
        return false;
      }
      return 3000;
    },
  });

  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    joinPoolRoom(id);

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["pools", id] });
    };

    socket.on("pool:statusChanged", handler);
    socket.on("pool:driverArrived", handler);
    socket.on("ride:statusChanged", handler);
    socket.on("ride:cancelled", handler);
    socket.on("ride:preferenceUpdated", handler);

    return () => {
      leavePoolRoom(id);
      socket.off("pool:statusChanged", handler);
      socket.off("pool:driverArrived", handler);
      socket.off("ride:statusChanged", handler);
      socket.off("ride:cancelled", handler);
      socket.off("ride:preferenceUpdated", handler);
    };
  }, [id, queryClient]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["pools", id] });

  const arriveMutation = useMutation({
    mutationFn: () => poolsApi.arrive(id),
    onSuccess: invalidate,
  });
  const startMutation = useMutation({
    mutationFn: () => poolsApi.start(id),
    onSuccess: invalidate,
    onError: () => refetch(),
  });
  const completeMutation = useMutation({
    mutationFn: () => poolsApi.complete(id),
    onSuccess: invalidate,
  });

  if (isLoading)
    return (
      <Layout>
        <LoadingSpinner text="Loading pool details…" />
      </Layout>
    );
  if (isError)
    return (
      <Layout>
        <ErrorState message="Could not load pool details." onRetry={refetch} />
      </Layout>
    );

  const rides = pool.rideRequests ?? [];
  const activeRides = rides.filter((r) => r.status !== "CANCELLED");
  const isCancelled =
    pool.status === "CANCELLED" || (rides.length > 0 && activeRides.length === 0);
  const isCompleted = pool.status === "COMPLETED";
  const effectiveStatus = isCancelled ? "CANCELLED" : pool.status;

  const immediateSeats = activeRides.reduce(
    (sum, r) => sum + (r.poolingPreference === "IMMEDIATE" ? (r.seatsRequested || 1) : 0),
    0
  );
  const waitSeats = activeRides.reduce(
    (sum, r) => sum + (r.poolingPreference === "WAIT" ? (r.seatsRequested || 1) : 0),
    0
  );
  const totalActiveSeats = immediateSeats + waitSeats;
  const isPoolReady =
    pool.status === "CONFIRMED" ||
    (totalActiveSeats > 0 && immediateSeats > waitSeats);

  const driver = pool.vehicle?.driver;
  const hasArrived = !!pool.driverArrivedAt;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pool Trip</h1>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">
              {pool.id.slice(0, 8)}…
            </p>
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-semibold">Ride Request Cancelled</p>
            <p className="text-red-600 text-sm mt-1">
              The passenger cancelled their ride request. This pool is cancelled and no longer active.
            </p>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Passengers</p>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-gray-800">
                  {isCancelled ? 0 : activeRides.length}
                </span>
                {isCancelled && rides.length > 0 && (
                  <span className="text-xs text-red-500 font-normal">
                    ({rides.length} cancelled)
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Seats Occupied</p>
              <p className="font-semibold text-gray-800">
                {isCancelled ? 0 : pool.seatsOccupied} / {pool.vehicle?.capacity ?? "?"}
              </p>
            </div>
            {driver && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Driver</p>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-gray-800">{driver.name}</span>
                </div>
              </div>
            )}
            {hasArrived && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Arrived At</p>
                <p className="font-medium text-gray-700 text-xs">
                  {new Date(pool.driverArrivedAt).toLocaleTimeString("en-BD", {
                    timeStyle: "short",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Passengers list */}
        {rides.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Rides in This Pool
            </h3>
            <div className="space-y-3">
              {rides.map((ride, i) => (
                <div
                  key={ride.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 flex-wrap">
                      <span>{ride.pickupLocation?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{ride.destinationLocation?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>
                        {ride.passenger?.name ?? "Passenger"}
                      </span>
                      <span>·</span>
                      <span>{ride.seatsRequested} seat{ride.seatsRequested !== 1 ? "s" : ""}</span>
                      {ride.fare && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-gray-600">৳{ride.fare.total}</span>
                        </>
                      )}
                      {ride.poolingPreference && (
                        <>
                          <span>·</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                              ride.poolingPreference === "IMMEDIATE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ride.poolingPreference === "IMMEDIATE" ? "⚡ Immediate" : "⏳ Wait"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver arrived info banner */}
        {!isCancelled && hasArrived && pool.status !== "ACTIVE" && pool.status !== "COMPLETED" && (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 font-medium">
              ✓ Driver arrived at pickup location
            </div>
            {!isPoolReady && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Waiting for passengers to be ready</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Trip can start once a majority of seats ({immediateSeats}/{totalActiveSeats} currently ready) are set to Immediate departure.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons — only show if not completed and not cancelled, and there is at least one active ride */}
        {!isCompleted && !isCancelled && activeRides.length > 0 && (
          <div className="space-y-3">
            {/* Arrive */}
            {!hasArrived &&
              (pool.status === "MATCHING" || pool.status === "CONFIRMED") && (
                <ActionButton
                  label={arriveMutation.isPending ? "Marking arrived…" : "Mark Arrived"}
                  icon={MapPin}
                  onClick={() => arriveMutation.mutate()}
                  disabled={arriveMutation.isPending}
                  variant="primary"
                />
              )}

            {/* Start Trip — only appears when driver has arrived AND pool is ready */}
            {hasArrived && isPoolReady && pool.status === "CONFIRMED" && (
              <ActionButton
                label={startMutation.isPending ? "Starting trip…" : "Start Trip"}
                icon={Play}
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                variant="green"
              />
            )}

            {startMutation.isError && (
              <p className="text-sm text-red-600" role="alert">
                {startMutation.error?.response?.data?.message ??
                  "Could not start the trip. The pool status was refreshed."}
              </p>
            )}

            {/* Complete */}
            {pool.status === "ACTIVE" && (
              <ActionButton
                label={completeMutation.isPending ? "Completing…" : "Complete Trip"}
                icon={Flag}
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                variant="yellow"
              />
            )}
          </div>
        )}

        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-semibold">Trip Completed!</p>
            <p className="text-green-600 text-sm mt-1">
              Great job — this pool has been marked as complete.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
