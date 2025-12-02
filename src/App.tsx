import "./App.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Meals from "./pages/Meals";
import MealDetail from "./pages/MealDetail";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Setting";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { routes } from "./routes";
import Goals from "./pages/Goals";
import UploadMeal from "./pages/UploadMeal";

function App() {
  return (
    <ChakraProvider>
      <ColorModeScript />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={routes.auth} element={<Auth />} />
            <Route path={routes.dash} element={<Dashboard />} />
            <Route path={routes.meals} element={<Meals />} />
            <Route path={"/meals/:id"} element={<MealDetail />} />
            <Route path={routes.analytics} element={<Analytics />} />
            <Route path={routes.goals} element={<Goals />} />
            <Route path={routes.settings} element={<Settings />} />
            <Route path={routes.mealNew} element={<UploadMeal />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
