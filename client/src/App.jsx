import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useParticipant } from "./context/ParticipantContext";

// Lazy loading or direct import depending on bundle size needs.
// For now, using direct imports.
import Home from "./pages/Home";
import Register from "./pages/Register";
import Phase1 from "./pages/Phase1";
import Phase2Lobby from "./pages/Phase2Lobby";
import Phase2Duel from "./pages/Phase2Duel";
import AdminDashboard from "./pages/AdminDashboard";
import Eliminated from "./pages/Eliminated";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ children }) => {
  const { participant } = useParticipant();
  if (!participant) {
    return <Navigate to="/register" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen pt-4 pb-12 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/phase1"
            element={
              <ProtectedRoute>
                <Phase1 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/phase2/lobby"
            element={
              <ProtectedRoute>
                <Phase2Lobby />
              </ProtectedRoute>
            }
          />

          <Route
            path="/phase2"
            element={
              <ProtectedRoute>
                <Phase2Lobby />
              </ProtectedRoute>
            }
          />

          <Route
            path="/phase2/waiting"
            element={
              <ProtectedRoute>
                <Phase2Lobby />
              </ProtectedRoute>
            }
          />

          <Route
            path="/phase2/duel"
            element={
              <ProtectedRoute>
                <Phase2Duel />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="/eliminated"
            element={
              <ProtectedRoute>
                <Eliminated />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
