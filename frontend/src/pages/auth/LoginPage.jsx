import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import useAuthStore from "../../store/authStore";
import { connectSocket } from "../../lib/socket";

const demoUsers = [
  { name: "Nusrat", role: "Passenger", email: "nusrat@example.com", password: "password123" },
  { name: "Jashim", role: "Driver", email: "jashim@test.com", password: "Password123" },
  { name: "Rafiq", role: "Passenger", email: "rafiq@gmail.com", password: "password123" },
  { name: "Motin", role: "Driver", email: "motin@test.com", password: "Password123" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (res) => {
      const user = res.data.user;
      setUser(user);
      connectSocket();
      if (user.role === "PASSENGER") {
        navigate("/passenger/dashboard");
      } else {
        navigate("/driver/dashboard");
      }
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message || "Invalid email or password."
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate(form);
  };

  const selectDemoUser = (user) => {
    setForm({ email: user.email, password: user.password });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">🚗</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Tesla Pool</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick demo login</p>
              <div className="grid grid-cols-2 gap-2">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    disabled={loginMutation.isPending}
                    onClick={() => selectDemoUser(user)}
                    className="text-left border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    <span className="block text-sm font-medium text-gray-800">{user.name}</span>
                    <span className="block text-xs text-gray-500">{user.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
