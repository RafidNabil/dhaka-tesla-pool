import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children, requiredRole }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const fallback =
      user.role === "PASSENGER"
        ? "/passenger/dashboard"
        : "/driver/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
