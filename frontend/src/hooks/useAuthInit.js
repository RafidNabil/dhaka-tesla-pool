import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../lib/api";
import useAuthStore from "../store/authStore";

export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const { data, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then((r) => r.data.user),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) setUser(data);
    if (isError) clearUser();
  }, [data, isError, setUser, clearUser]);
}
