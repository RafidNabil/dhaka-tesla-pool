import useAuthStore from "../store/authStore";
import PassengerSidebar from "./PassengerSidebar";
import DriverSidebar from "./DriverSidebar";

export default function Layout({ children }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user?.role === "PASSENGER" && <PassengerSidebar />}
      {user?.role === "DRIVER" && <DriverSidebar />}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
