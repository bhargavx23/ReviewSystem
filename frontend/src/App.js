import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container, Box } from "@mui/material";
import Navbar from "./components/Navbar";
import CollegeHeader from "./components/CollegeHeader";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GuideDashboard from "./pages/GuideDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("userName");
    if (token && role) {
      setUser({ role, name });
    }
  }, []);

  const RequireAuth = ({ children, allowedRole }) => {
    const role = localStorage.getItem("role");
    if (!user || role !== allowedRole) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        {isAuthenticated && <Navbar />}
        <Container maxWidth="xl" sx={{ pt: isAuthenticated ? 0 : 4 }}>
          {isAuthenticated && <CollegeHeader />}
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/admin"
              element={
                <RequireAuth allowedRole="admin">
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/guide"
              element={
                <RequireAuth allowedRole="guide">
                  <GuideDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/student"
              element={
                <RequireAuth allowedRole="student">
                  <StudentDashboard />
                </RequireAuth>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
