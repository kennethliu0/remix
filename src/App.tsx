import "./App.css";
import HomePage from "./pages/HomePage";
import ReorderPlaylists from "./pages/ReorderPlaylists";
import { HashRouter, Route, Routes } from "react-router-dom";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route
          path="/playlists"
          element={<ReorderPlaylists />}
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
