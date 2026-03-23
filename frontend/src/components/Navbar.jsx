import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  if (!role) return null;

  return (
    <AppBar
      position="static"
      sx={{ bgcolor: "#1976d2", boxShadow: "0 2px 10px rgba(25,118,210,0.2)" }}
    >
      <Toolbar sx={{ justifyContent: "space-between", py: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src="/micLogo.jpeg"
            alt="MIC Logo"
            sx={{
              width: 40,
              height: 40,
              border: "2px solid white",
              "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
            }}
          />
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "white", lineHeight: 1 }}
            >
              DVR & DR.HS MIC
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.8)" }}
            >
              College of Technology
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.9)", mr: 2 }}
          >
            {userName} ({role.toUpperCase()})
          </Typography>
          <Button
            onClick={() => navigate("/admin")}
            sx={{
              color: isActive("/admin") ? "white" : "rgba(255,255,255,0.9)",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                bgcolor: isActive("/admin")
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.1)",
                fontWeight: 600,
              },
            }}
          >
            Admin
          </Button>
          <Button
            onClick={() => navigate("/guide")}
            sx={{
              color: isActive("/guide") ? "white" : "rgba(255,255,255,0.9)",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                bgcolor: isActive("/guide")
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.1)",
                fontWeight: 600,
              },
            }}
          >
            Guide
          </Button>
          <Button
            onClick={() => navigate("/student")}
            sx={{
              color: isActive("/student") ? "white" : "rgba(255,255,255,0.9)",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                bgcolor: isActive("/student")
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(255,255,255,0.1)",
                fontWeight: 600,
              },
            }}
          >
            Student
          </Button>
          <Button
            onClick={handleLogout}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.8)",
              color: "white",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: 20,
              px: 2,
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255,255,255,0.1)",
                boxShadow: "0 4px 12px rgba(255,255,255,0.2)",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
