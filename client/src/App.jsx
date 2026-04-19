import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import api from "./api/client";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Growth from "./pages/Growth";
import Tasks from "./pages/Tasks";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function ThemedApp() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api
      .get("/settings")
      .then(({ data }) => {
        const overrides = data.settings?.themeOverrides;
        if (!overrides) return;
        const map = {
          primary: "--color-primary",
          secondary: "--color-secondary",
          accent: "--color-accent",
          bg: "--color-bg",
        };
        Object.entries(overrides).forEach(([k, v]) => {
          if (map[k] && v)
            document.documentElement.style.setProperty(map[k], v);
        });
      })
      .catch(() => {});
  }, [user]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestRoute>
            <Landing />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study"
        element={
          <ProtectedRoute>
            <Study />
          </ProtectedRoute>
        }
      />
      <Route
        path="/growth"
        element={
          <ProtectedRoute>
            <Growth />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
