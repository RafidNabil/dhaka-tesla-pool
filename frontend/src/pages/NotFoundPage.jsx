import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);

  const dashboardPath =
    user?.role === "DRIVER" ? "/driver/dashboard" : "/passenger/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-6">
        Sorry, the page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to={user ? dashboardPath : "/login"}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
