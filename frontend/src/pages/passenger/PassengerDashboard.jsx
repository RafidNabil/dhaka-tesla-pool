import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ridesApi } from "../../lib/api";
import useAuthStore from "../../store/authStore";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import StatusBadge from "../../components/StatusBadge";
import { PlusCircle, ArrowRight, History } from "lucide-react";

function ActiveRideCard({ ride }) {
  const driver = ride.pool?.vehicle?.driver;
  const fare = ride.fare?.total;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Your Active Ride</h2>
        <StatusBadge status={ride.status} />
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-4">
        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          {ride.pickupLocation.name}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
          {ride.destinationLocation.name}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-5">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Seats</p>
          <p className="font-medium text-gray-700">{ride.seatsRequested}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Pooling</p>
          <p className="font-medium text-gray-700">{ride.poolingPreference}</p>
        </div>
        {driver && (
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Driver</p>
            <p className="font-medium text-gray-700">{driver.name}</p>
          </div>
        )}
        {fare != null && (
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Fare</p>
            <p className="font-semibold text-gray-900">৳{fare}</p>
          </div>
        )}
      </div>

      <Link
        to={`/passenger/rides/${ride.id}`}
        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        View Ride
      </Link>
    </div>
  );
}

function NoActiveRide() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center shadow-sm">
      <p className="text-gray-400 text-sm mb-4">No active ride</p>
      <Link
        to="/passenger/request"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        <PlusCircle className="w-4 h-4" />
        Request a Ride
      </Link>
    </div>
  );
}

export default function PassengerDashboard() {
  const user = useAuthStore((s) => s.user);

  const {
    data: activeRide,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["rides", "active"],
    queryFn: () => ridesApi.getActive().then((r) => r.data.ride),
    retry: false,
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Where are you heading today?
          </p>
        </div>

        {/* Active ride section */}
        {isLoading && <LoadingSpinner text="Checking your rides…" />}
        {isError && (
          <ErrorState
            message="Could not load your ride status."
            onRetry={refetch}
          />
        )}
        {!isLoading && !isError && activeRide && (
          <ActiveRideCard ride={activeRide} />
        )}
        {!isLoading && !isError && !activeRide && <NoActiveRide />}

        {/* Quick action bar */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/passenger/request"
            className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition text-center"
          >
            <PlusCircle className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Request Ride
            </span>
          </Link>
          <Link
            to="/passenger/history"
            className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition text-center"
          >
            <History className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Ride History
            </span>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
