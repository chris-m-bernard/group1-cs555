import "./App.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import Auth from "./pages/Auth";
import Meals from "./pages/Meals";
import MealDetail from "./pages/MealDetail";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Setting";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import UploadMeal from "./pages/UploadMeal";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { routes } from "./routes";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ChakraProvider>
      <ColorModeScript />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path={routes.auth} element={<Auth />} />

            {/* Protected routes */}
            <Route
              path={routes.dash}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={routes.meals}
              element={
                <ProtectedRoute>
                  <Meals />
                </ProtectedRoute>
              }
            />
            <Route
              path={"/meals/:mealId"}
              element={
                <ProtectedRoute>
                  <MealDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path={routes.analytics}
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path={routes.goals}
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path={routes.settings}
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path={routes.mealNew}
              element={
                <ProtectedRoute>
                  <UploadMeal />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
