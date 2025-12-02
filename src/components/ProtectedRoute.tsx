// src/components/ProtectedRoute.tsx
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { routes } from "../routes";

type ProtectedRouteProps = {
  children: ReactElement;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth(); // ⬅️ no loading here

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to={routes.auth} replace />;
  }

  // Logged in → show page
  return children;
};

export default ProtectedRoute;
