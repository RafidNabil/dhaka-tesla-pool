import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import { useAuthInit } from "./hooks/useAuthInit";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

// Passenger Pages
import PassengerDashboard from "./pages/passenger/PassengerDashboard";
import RequestRidePage from "./pages/passenger/RequestRidePage";
import RideDetailPage from "./pages/passenger/RideDetailPage";
import PassengerHistoryPage from "./pages/passenger/PassengerHistoryPage";

// Driver Pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverOffersPage from "./pages/driver/DriverOffersPage";
import PoolDetailPage from "./pages/driver/PoolDetailPage";
import MatchingPoolsPage from "./pages/driver/MatchingPoolsPage";
import DriverHistoryPage from "./pages/driver/DriverHistoryPage";

// 404
import NotFoundPage from "./pages/NotFoundPage";

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Navigate
      to={user.role === "DRIVER" ? "/driver/dashboard" : "/passenger/dashboard"}
      replace
    />
  );
}

export default function App() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Passenger Routes */}
      <Route
        path="/passenger/dashboard"
        element={
          <ProtectedRoute requiredRole="PASSENGER">
            <PassengerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger/request"
        element={
          <ProtectedRoute requiredRole="PASSENGER">
            <RequestRidePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger/rides/:id"
        element={
          <ProtectedRoute requiredRole="PASSENGER">
            <RideDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger/history"
        element={
          <ProtectedRoute requiredRole="PASSENGER">
            <PassengerHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/offers"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <DriverOffersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/pools/:id"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <PoolDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/pools"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <MatchingPoolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/history"
        element={
          <ProtectedRoute requiredRole="DRIVER">
            <DriverHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
