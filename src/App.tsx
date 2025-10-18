import "./App.css";
import { Provider } from "./components/ui/provider";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />}></Route>
          <Route path="/Home" element={<Home />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/Auth" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
