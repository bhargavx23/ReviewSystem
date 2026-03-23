import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  CssBaseline,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CollegeHeader from "../components/CollegeHeader";
import { authAPI } from "../services/api";

const Login = ({ setUser }) => {
  const [step, setStep] = useState(1);
  const [emailOrRollNo, setEmailOrRollNo] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const sendOtpHandler = async () => {
    setLoading(true);
    setError("");
    try {
      await authAPI.sendOtp({ emailOrRollNo });
      setMessage("✅ OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    }
    setLoading(false);
  };

  const verifyOtpHandler = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authAPI.verifyOtp({ emailOrRollNo, otp });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name);
      setUser(response.data.user);

      const role = response.data.user.role;
      navigate(`/${role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Paper elevation={10} sx={{ mt: 8, p: 4, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "#1e3a8a" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold" }}
          >
            Project Review Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mb: 2, width: "100%" }}>
              {message}
            </Alert>
          )}

          {step === 1 ? (
            <>
              <TextField
                fullWidth
                label="Email or Roll Number"
                value={emailOrRollNo}
                onChange={(e) => setEmailOrRollNo(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={sendOtpHandler}
                disabled={!emailOrRollNo || loading}
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>
                OTP sent to {emailOrRollNo}
              </Typography>
              <TextField
                fullWidth
                label="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 3 }}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    fontSize: "1.5rem",
                    letterSpacing: "5px",
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={verifyOtpHandler}
                disabled={otp.length !== 6 || loading}
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Login"
                )}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
