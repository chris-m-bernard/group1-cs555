// src/components/ProtectedRoute.tsx
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "../lib/auth-context";
import { routes } from "../routes";

type ProtectedRouteProps = {
  children: ReactElement;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, initializing } = useAuth();

  // ⏳ While Firebase is checking the session, don't redirect yet
  if (initializing) {
    return (
      <Center minH="100vh">
        <Spinner />
      </Center>
    );
  }

  // ❌ After init: no user → send to auth
  if (!user) {
    return <Navigate to={routes.auth} replace />;
  }

  // ✅ Logged in → allow access
  return children;
};

export default ProtectedRoute;
