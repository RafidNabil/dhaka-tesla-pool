import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, History, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../lib/api";
import useAuthStore from "../store/authStore";
import { disconnectSocket } from "../lib/socket";

const links = [
  { to: "/passenger/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/passenger/request", icon: PlusCircle, label: "Request Ride" },
  { to: "/passenger/history", icon: History, label: "Ride History" },
];

export default function PassengerSidebar() {
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearUser();
      disconnectSocket();
      queryClient.clear();
      navigate("/login");
    },
  });

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col py-6 px-3 shrink-0">
      {/* Brand */}
      <div className="px-3 mb-8">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">
          Tesla Pool
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Passenger</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {logoutMutation.isPending ? "Logging out…" : "Logout"}
      </button>
    </aside>
  );
}
