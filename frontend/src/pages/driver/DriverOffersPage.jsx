import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi } from "../../lib/api";
import Layout from "../../components/Layout";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { ArrowRight, CheckCircle, XCircle, Users } from "lucide-react";

function OfferCard({ offer, onAccept, onReject, isAccepting, isRejecting }) {
  const rides = offer.pool?.rideRequests ?? [];
  const totalSeats = rides.reduce((s, r) => s + (r.seatsRequested ?? 0), 0);

  // Derive a route from the first ride's pickup/destination
  const firstRide = rides[0];
  const isPending = offer.status === "PENDING";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-mono">
            Offer {offer.id.slice(0, 8)}…
          </p>
          {firstRide && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mt-1 flex-wrap">
              <span>{firstRide.pickupLocation?.name}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{firstRide.destinationLocation?.name}</span>
            </div>
          )}
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{rides.length} passenger{rides.length !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-gray-300">|</span>
        <span>{totalSeats} seat{totalSeats !== 1 ? "s" : ""} total</span>
      </div>

      {/* All rides in pool */}
      {rides.length > 1 && (
        <div className="space-y-1.5 mb-4">
          {rides.map((ride, i) => (
            <div key={ride.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium shrink-0">
                {i + 1}
              </span>
              <span>{ride.pickupLocation?.name}</span>
              <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
              <span>{ride.destinationLocation?.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            disabled={isAccepting || isRejecting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {isAccepting ? "Accepting…" : "Accept"}
          </button>
          <button
            onClick={onReject}
            disabled={isAccepting || isRejecting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {isRejecting ? "Rejecting…" : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DriverOffersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["offers"],
    queryFn: () => offersApi.getAll().then((r) => r.data.offers),
    refetchInterval: 15000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => offersApi.accept(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      // Navigate to the pool detail page
      const poolId = res.data.offer?.poolId ?? res.data.poolId;
      if (poolId) navigate(`/driver/pools/${poolId}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => offersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });

  const pending = data?.filter((o) => o.status === "PENDING") ?? [];
  const others = data?.filter((o) => o.status !== "PENDING") ?? [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pool Offers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Accept or reject pool offers sent to you.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading offers…" />}
        {isError && (
          <ErrorState message="Could not load offers." onRetry={refetch} />
        )}

        {!isLoading && !isError && (
          <>
            {/* Pending section */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pending ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onAccept={() => acceptMutation.mutate(offer.id)}
                      onReject={() => rejectMutation.mutate(offer.id)}
                      isAccepting={
                        acceptMutation.isPending &&
                        acceptMutation.variables === offer.id
                      }
                      isRejecting={
                        rejectMutation.isPending &&
                        rejectMutation.variables === offer.id
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && others.length === 0 && (
              <EmptyState
                title="No offers yet"
                description="Go online to receive pool offers from the system."
              />
            )}

            {/* Past offers */}
            {others.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Past Offers
                </h2>
                <div className="space-y-3">
                  {others.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onAccept={() => {}}
                      onReject={() => {}}
                      isAccepting={false}
                      isRejecting={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
