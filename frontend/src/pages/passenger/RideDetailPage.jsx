import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ridesApi } from "../../lib/api";
import { getSocket, joinPoolRoom, leavePoolRoom, connectSocket } from "../../lib/socket";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import StatusBadge from "../../components/StatusBadge";
import { ArrowRight, User, Car, Wallet, X } from "lucide-react";

const RIDE_STEPS = ["REQUESTED", "MATCHED", "STARTED", "COMPLETED"];

function RideStepper({ status }) {
  const current = RIDE_STEPS.indexOf(status);
  const labels = ["Ride Requested", "Driver Matched", "Trip in Progress", "Completed"];

  return (
    <div className="flex items-start gap-0">
      {RIDE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === RIDE_STEPS.length - 1;
        return (
          <div key={step} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {/* Circle */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                  done
                    ? "bg-green-500 border-green-500"
                    : active
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : active ? (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                ) : null}
              </div>
              {/* Connector line */}
              {!last && (
                <div
                  className={`flex-1 h-0.5 ${
                    done ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <p
              className={`text-xs mt-1.5 text-center leading-tight ${
                active
                  ? "text-blue-600 font-semibold"
                  : done
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {labels[i]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function RideDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: ride,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["rides", id],
    queryFn: () => ridesApi.getById(id).then((r) => r.data.ride),
    refetchInterval: (data) => {
      if (data?.status === "COMPLETED" || data?.status === "CANCELLED") return false;
      return 10000;
    },
  });

  useEffect(() => {
    if (!ride?.poolId) return;
    connectSocket();
    const socket = getSocket();
    joinPoolRoom(ride.poolId);

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["rides", id] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });
    };

    socket.on("ride:statusChanged", handler);
    socket.on("pool:statusChanged", handler);

    return () => {
      leavePoolRoom(ride.poolId);
      socket.off("ride:statusChanged", handler);
      socket.off("pool:statusChanged", handler);
    };
  }, [ride?.poolId, id, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: () => ridesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides", id] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });
    },
  });

  const preferenceMutation = useMutation({
    mutationFn: (poolingPreference) =>
      ridesApi.updatePoolingPreference(id, poolingPreference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides", id] });
      queryClient.invalidateQueries({ queryKey: ["rides", "active"] });
    },
  });

  if (isLoading)
    return (
      <Layout>
        <LoadingSpinner text="Loading ride details…" />
      </Layout>
    );
  if (isError)
    return (
      <Layout>
        <ErrorState
          message="Could not load ride details."
          onRetry={refetch}
        />
      </Layout>
    );

  const driver = ride.pool?.vehicle?.driver;
  const canCancel = ride.status === "REQUESTED" || ride.status === "MATCHED";
  const isCancelled = ride.status === "CANCELLED";

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ride Details</h1>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">{ride.id.slice(0, 8)}…</p>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        {/* Route card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
              {ride.pickupLocation.name}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg">
              {ride.destinationLocation.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Seats</p>
              <p className="font-medium text-gray-700">{ride.seatsRequested}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Pooling Preference</p>
              {canCancel ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {["WAIT", "IMMEDIATE"].map((preference) => (
                      <button
                        key={preference}
                        type="button"
                        onClick={() => preferenceMutation.mutate(preference)}
                        disabled={
                          preference === ride.poolingPreference ||
                          preferenceMutation.isPending
                        }
                        aria-pressed={ride.poolingPreference === preference}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          ride.poolingPreference === preference
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 text-gray-700 hover:border-blue-300"
                        }`}
                      >
                        {preference === "WAIT" ? "Wait" : "Immediate"}
                      </button>
                    ))}
                  </div>
                  {preferenceMutation.isError && (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {preferenceMutation.error?.response?.data?.message ||
                        "Could not update pooling preference."}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-medium text-gray-700">{ride.poolingPreference}</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Requested</p>
              <p className="font-medium text-gray-700">
                {new Date(ride.requestedAt).toLocaleString("en-BD", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Status stepper — only for non-cancelled */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Trip Progress</h3>
            <RideStepper status={ride.status} />
          </div>
        )}

        {/* Driver & vehicle */}
        {driver && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Driver</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{driver.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>
                    Capacity: {ride.pool?.vehicle?.capacity ?? "—"} seats
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fare */}
        {ride.fare && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Fare</h3>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">
                ৳{ride.fare.total}
              </span>
              <span className="text-xs text-gray-400 ml-1">CASH</span>
            </div>
          </div>
        )}

        {/* Pool info */}
        {ride.pool && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pool Info</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Pool Status</p>
                <StatusBadge status={ride.pool.status} />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Seats Occupied</p>
                <p className="font-medium text-gray-700">
                  {ride.pool.seatsOccupied} / {ride.pool.vehicle?.capacity ?? "?"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            {cancelMutation.isPending ? "Cancelling…" : "Cancel Ride"}
          </button>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium text-sm">This ride was cancelled.</p>
            <button
              onClick={() => navigate("/passenger/request")}
              className="mt-3 text-blue-600 text-sm font-medium hover:underline"
            >
              Request a new ride →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
