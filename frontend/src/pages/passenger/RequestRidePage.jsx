import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { locationsApi, faresApi, ridesApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import { ArrowRight, Zap } from "lucide-react";

const POOLING_OPTIONS = [
  {
    value: "WAIT",
    label: "Wait",
    description: "Wait for others — cheaper fare",
  },
  {
    value: "IMMEDIATE",
    label: "Immediate",
    description: "Depart now, fewer wait",
  },
];

export default function RequestRidePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pickupLocationId: "",
    destinationLocationId: "",
    seatsRequested: 1,
    poolingPreference: "WAIT",
  });

  const [estimate, setEstimate] = useState(null);
  const [estimateError, setEstimateError] = useState("");

  // Load all locations
  const {
    data: locations,
    isLoading: locLoading,
    isError: locError,
    refetch: locRefetch,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationsApi.getAll().then((r) => r.data.locations),
  });

  // Fare estimate mutation
  const estimateMutation = useMutation({
    mutationFn: (data) => faresApi.estimate(data),
    onSuccess: (res) => {
      setEstimate(res.data);
      setEstimateError("");
    },
    onError: (err) => {
      setEstimateError(
        err?.response?.data?.message || "Could not estimate fare."
      );
    },
  });

  // Request ride mutation
  const rideMutation = useMutation({
    mutationFn: (data) => ridesApi.create(data),
    onSuccess: (res) => {
      navigate(`/passenger/rides/${res.data.ride.id}`);
    },
    onError: (err) => {
      setEstimateError(
        err?.response?.data?.message || "Could not request ride."
      );
    },
  });

  const canEstimate =
    form.pickupLocationId &&
    form.destinationLocationId &&
    form.pickupLocationId !== form.destinationLocationId;

  const handleEstimate = () => {
    if (!canEstimate) return;
    estimateMutation.mutate({
      pickupLocationId: form.pickupLocationId,
      destinationLocationId: form.destinationLocationId,
      seatsRequested: form.seatsRequested,
    });
  };

  const handleRequest = () => {
    rideMutation.mutate(form);
  };

  if (locLoading) return <Layout><LoadingSpinner text="Loading locations…" /></Layout>;
  if (locError)
    return (
      <Layout>
        <ErrorState message="Could not load locations." onRetry={locRefetch} />
      </Layout>
    );

  const filteredDestinations = locations?.filter(
    (l) => l.id !== form.pickupLocationId
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request a Ride</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below to request your ride.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          {/* Pickup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Pickup Location
            </label>
            <select
              required
              value={form.pickupLocationId}
              onChange={(e) => {
                setForm({ ...form, pickupLocationId: e.target.value });
                setEstimate(null);
              }}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select pickup…</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route arrow */}
          {form.pickupLocationId && (
            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Destination
            </label>
            <select
              required
              value={form.destinationLocationId}
              onChange={(e) => {
                setForm({ ...form, destinationLocationId: e.target.value });
                setEstimate(null);
              }}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select destination…</option>
              {filteredDestinations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seats Needed
            </label>
            <div className="flex gap-3">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, seatsRequested: n });
                    setEstimate(null);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    form.seatsRequested === n
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Pooling preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pooling Preference
            </label>
            <div className="grid grid-cols-2 gap-3">
              {POOLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, poolingPreference: opt.value })
                  }
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    form.poolingPreference === opt.value
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Estimate fare */}
          <button
            type="button"
            onClick={handleEstimate}
            disabled={!canEstimate || estimateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-medium text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-4 h-4" />
            {estimateMutation.isPending ? "Estimating…" : "Estimate Fare"}
          </button>

          {/* Estimate result */}
          {estimate && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">
                Estimated Fare
              </p>
              <p className="text-2xl font-bold text-green-700">
                ৳{estimate.estimatedFare ?? estimate.fare ?? estimate.total ?? "—"}
              </p>
            </div>
          )}

          {estimateError && (
            <p className="text-red-600 text-sm text-center">{estimateError}</p>
          )}

          {/* Request button */}
          <button
            type="button"
            onClick={handleRequest}
            disabled={!canEstimate || rideMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {rideMutation.isPending ? "Requesting…" : "Request Ride"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
