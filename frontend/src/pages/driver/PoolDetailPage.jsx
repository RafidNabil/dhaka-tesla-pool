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
import { ArrowRight, User, MapPin, CheckCircle, Play, Flag, Users } from "lucide-react";

function ActionButton({ label, icon: Icon, onClick, disabled, variant = "primary" }) {
  const base =
    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors";
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
      if (data?.status === "COMPLETED" || data?.status === "CANCELLED")
        return false;
      return 15000;
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

    return () => {
      leavePoolRoom(id);
      socket.off("pool:statusChanged", handler);
      socket.off("pool:driverArrived", handler);
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
  const driver = pool.vehicle?.driver;
  const hasArrived = !!pool.driverArrivedAt;
  const isCompleted = pool.status === "COMPLETED";
  const isCancelled = pool.status === "CANCELLED";

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
          <StatusBadge status={pool.status} />
        </div>

        {/* Stats card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Passengers</p>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-gray-800">{rides.length}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Seats Occupied</p>
              <p className="font-semibold text-gray-800">
                {pool.seatsOccupied} / {pool.vehicle?.capacity ?? "?"}
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

        {/* Driver arrived info */}
        {hasArrived && pool.status !== "ACTIVE" && pool.status !== "COMPLETED" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 font-medium">
            ✓ Driver arrived — ready to start trip
          </div>
        )}

        {/* Action buttons */}
        {!isCompleted && !isCancelled && (
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

            {/* Start */}
            {hasArrived && pool.status === "CONFIRMED" && (
              <ActionButton
                label={startMutation.isPending ? "Starting trip…" : "Start Trip"}
                icon={Play}
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                variant="green"
              />
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
