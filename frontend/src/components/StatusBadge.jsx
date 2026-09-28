const STATUS_CONFIG = {
  // Ride statuses
  REQUESTED: { label: "Requested", className: "bg-blue-100 text-blue-700" },
  MATCHED: { label: "Matched", className: "bg-purple-100 text-purple-700" },
  DRIVER_ON_THE_WAY: { label: "Driver on the way", className: "bg-indigo-100 text-indigo-700" },
  DRIVER_ARRIVED: { label: "Driver arrived", className: "bg-emerald-100 text-emerald-700" },
  STARTED: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },

  // Pool statuses
  MATCHING: { label: "Matching", className: "bg-blue-100 text-blue-700" },
  CONFIRMED: { label: "Confirmed", className: "bg-purple-100 text-purple-700" },
  ACTIVE: { label: "Active", className: "bg-yellow-100 text-yellow-700" },

  // Offer statuses
  PENDING: { label: "Pending", className: "bg-orange-100 text-orange-700" },
  ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status, label: customLabel }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {customLabel ?? config.label}
    </span>
  );
}
