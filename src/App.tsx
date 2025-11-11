import "./App.css";
import { Provider } from "./components/ui/provider";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { routes } from "./routes"

function App() {
  return (
    <Provider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route index element={<Home />}></Route>
            <Route path={routes.auth} element={<Auth />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;
