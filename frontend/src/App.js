import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Toaster from "./components/Toaster";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
// Removed theme icons; app is light-only now

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GuideDashboard = lazy(() => import("./pages/GuideDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));

function AppContent() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("userName");
    return token && role ? { role, name } : null;
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("userName");
    if (token && role) {
      setUser({ role, name });
    } else {
      setUser(null);
    }
  }, []);

  const RequireAuth = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || !role || !allowedRoles?.includes(role)) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return children;
  };

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-base-100 transition-all duration-300">
      {isAuthenticated && <Navbar />}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Login setUser={setUser} />
                </motion.div>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth allowedRoles={["admin", "hod"]}>
                  <Suspense fallback={<div className="skeleton h-64" />}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <AdminDashboard />
                    </motion.div>
                  </Suspense>
                </RequireAuth>
              }
            />

            <Route
              path="/admin/hod"
              element={
                <RequireAuth allowedRoles={["admin", "hod"]}>
                  <Suspense fallback={<div className="skeleton h-64" />}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <AdminDashboard />
                    </motion.div>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/guide"
              element={
                <RequireAuth allowedRoles={["guide"]}>
                  <Suspense fallback={<div className="skeleton h-64" />}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <GuideDashboard />
                    </motion.div>
                  </Suspense>
                </RequireAuth>
              }
            />

            <Route
              path="/student"
              element={
                <RequireAuth allowedRoles={["student"]}>
                  <Suspense fallback={<div className="skeleton h-64" />}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <StudentDashboard />
                    </motion.div>
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
