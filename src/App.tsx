import "./App.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { routes } from "./routes";

function App() {
  return (
    <ChakraProvider>
      <ColorModeScript />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={routes.auth} element={<Auth />} />
            <Route path={routes.dash} element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
