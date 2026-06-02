import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Returns true if the currently logged-in user is the blog owner.
 * Ownership is determined by matching the user's openId against the
 * VITE_OWNER_OPEN_ID environment variable injected at build time.
 */
export function useIsOwner(): boolean {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return false;
  const ownerOpenId = import.meta.env.VITE_OWNER_OPEN_ID ?? "";
  // If env var is not set (dev mode), fall back to role-based check
  if (!ownerOpenId) return user.role === "admin";
  return user.openId === ownerOpenId;
}
