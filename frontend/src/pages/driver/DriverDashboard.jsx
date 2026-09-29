import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi, poolsApi, offersApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import StatusBadge from "../../components/StatusBadge";
import useAuthStore from "../../store/authStore";
import { Car, Bell, Power, ChevronRight, ArrowRight } from "lucide-react";

function OnlineToggle({ vehicle, onToggle, isPending }) {
  return (
    <div
      className={`flex items-center justify-between p-5 rounded-2xl border-2 ${
        vehicle.online
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            vehicle.online ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <Power className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">
            {vehicle.online ? "Online" : "Offline"}
          </p>
          <p className="text-xs text-gray-400">
            {vehicle.online
              ? "You can receive pool offers"
              : "Go online to receive offers"}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={isPending}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          vehicle.online ? "bg-green-500" : "bg-gray-300"
        } ${isPending ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            vehicle.online ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function DriverDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const {
    data: vehicle,
    isLoading: vLoading,
    isError: vError,
    refetch: vRefetch,
  } = useQuery({
    queryKey: ["vehicle", "me"],
    queryFn: () => vehiclesApi.getMe().then((r) => r.data.vehicle),
  });

  const {
    data: offers,
    isLoading: oLoading,
  } = useQuery({
    queryKey: ["offers"],
    queryFn: () => offersApi.getAll().then((r) => r.data.offers),
    refetchInterval: 30000,
  });

  const { data: activePool } = useQuery({
    queryKey: ["pools", "active"],
    queryFn: () => poolsApi.getActive().then((r) => r.data.pool),
    refetchInterval: 30000,
  });

  const statusMutation = useMutation({
    mutationFn: (online) => vehiclesApi.updateStatus(online),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle", "me"] });
    },
  });

  const pendingOffers = offers?.filter((o) => o.status === "PENDING") ?? [];

  if (vLoading)
    return (
      <Layout>
        <LoadingSpinner text="Loading dashboard…" />
      </Layout>
    );
  if (vError)
    return (
      <Layout>
        <ErrorState message="Could not load vehicle data." onRetry={vRefetch} />
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Driver Dashboard</p>
        </div>

        {/* Online/Offline toggle */}
        {vehicle && (
          <OnlineToggle
            vehicle={vehicle}
            onToggle={() => statusMutation.mutate(!vehicle.online)}
            isPending={statusMutation.isPending}
          />
        )}

        {/* Vehicle info */}
        {vehicle && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Your Vehicle</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Capacity: {vehicle.capacity} seats
                </p>
              </div>
            </div>
          </div>
        )}

        {activePool && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Current Pool
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {activePool.rideRequests?.length ?? 0} ride{activePool.rideRequests?.length === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This pool is still assigned to you after reconnecting.
                </p>
              </div>
              <Link
                to={`/driver/pools/${activePool.id}`}
                className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Open pool
              </Link>
            </div>
          </div>
        )}

        {/* Pending offers summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Pool Offers</h3>
            </div>
            <Link
              to="/driver/offers"
              className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {oLoading ? (
            <p className="text-gray-400 text-sm">Loading offers…</p>
          ) : pendingOffers.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending offers right now.</p>
          ) : (
            <div className="space-y-3">
              {pendingOffers.slice(0, 3).map((offer) => {
                const rides = offer.pool?.rideRequests ?? [];
                const first = rides[0];
                return (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between py-2 border-t border-gray-100"
                  >
                    <div>
                      {first && (
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          <span>{first.pickupLocation?.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span>{first.destinationLocation?.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={offer.status} />
                        <span className="text-xs text-gray-400">
                          {rides.length} ride{rides.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/driver/offers"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
