import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { showToast } from "../components/Toaster";
import { authAPI } from "../services/api";

const Login = ({ setUser }) => {
  const [step, setStep] = useState(1);
  const [emailOrRollNo, setEmailOrRollNo] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtpHandler = async () => {
    if (!emailOrRollNo.trim()) {
      showToast("Please enter email or roll number", "error");
      return;
    }

    setLoading(true);
    showToast("Sending OTP...", "loading");

    try {
      await authAPI.sendOtp({ emailOrRollNo });
      showToast("✅ OTP sent to your email!", "success");
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.message || "Error sending OTP", "error");
    } finally {
      setLoading(false);
      showToast("dismiss");
    }
  };

  const verifyOtpHandler = async () => {
    if (otp.length !== 6) {
      showToast("Please enter valid 6-digit OTP", "error");
      return;
    }

    setLoading(true);
    showToast("Verifying...", "loading");

    try {
      const response = await authAPI.verifyOtp({ emailOrRollNo, otp });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.user.role);
      localStorage.setItem("userName", response.data.user.name);
      setUser(response.data.user);

      const role = response.data.user.role;
      showToast(`Welcome ${response.data.user.name}!`, "success");
      navigate(`/${role}`, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
      showToast("dismiss");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8  overflow-hidden">
      <div className="w-full min-h-[40vh] max-w-sm sm:max-w-md md:max-w-lg mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-50 via-primary-50 to-slate-100 backdrop-blur-xl shadow-2xl shadow-slate-300/40 border border-slate-200/60 rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden glass-effect"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary-500 via-purple-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/30"
            >
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">
              ReviewSlot
            </h1>
            <p className="text-lg sm:text-xl text-slate-600/90 font-semibold">
              Secure OTP Login
            </p>
          </div>

          {/* Enhanced Step Progress */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-500 ${step >= 1 ? "bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50 scale-125" : "bg-slate-300 shadow-md"}`}
              />
              <div
                className={`mx-3 w-16 h-1 sm:w-20 sm:h-1.5 bg-gradient-to-r ${step === 1 ? "bg-slate-300" : "from-primary-400 to-accent-400 shadow-inner"}`}
              />
              <div
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-500 ${step === 2 ? "bg-gradient-to-r from-accent-500 to-teal-500 shadow-lg shadow-accent-500/50 scale-125" : step >= 2 ? "bg-accent-400 shadow-md" : "bg-slate-300 shadow-md"}`}
              />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <motion.label
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="block text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-4 sm:mb-6 text-center leading-tight"
                  >
                    Enter your Email or Roll No
                  </motion.label>
                  <div className="relative group">
                    {/* <Mail className="absolute inset-y-0 left-0  sm:top-6  sm:4 z-10 flex items-center text-slate-400 group-focus-within:text-primary-500 transition-colors duration-300 h-10 w-10 sm:h-7 sm:w-7" /> */}
                    <input
                      type="text"
                      placeholder="student@college.edu or 21CS001"
                      className="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/70 hover:border-slate-300/80 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/30 shadow-lg hover:shadow-xl focus:shadow-glow-primary transition-all duration-400 font-medium placeholder-slate-400"
                      value={emailOrRollNo}
                      onChange={(e) => setEmailOrRollNo(e.target.value)}
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !emailOrRollNo.trim()}
                  onClick={sendOtpHandler}
                  className="group relative w-full flex items-center justify-center gap-3 py-5 sm:py-6 px-6 sm:px-8 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white font-bold text-lg sm:text-xl rounded-2xl shadow-2xl hover:shadow-glow-primary active:shadow-xl active:translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                      <span className="tracking-wide">Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-6 transition-transform duration-300" />
                      <span className="tracking-wide">Send Secure OTP</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-4 sm:p-2 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-100 to-teal-100/80 text-accent-800 border border-accent-200/50 px-5 py-3 rounded-2xl mb-6 font-mono font-bold text-base sm:text-lg shadow-lg hover:shadow-accent-300/50 transition-all duration-300 cursor-default"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="break-all">{emailOrRollNo}</span>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-3 leading-tight"
                  >
                    Verify with OTP
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-600/90 text-sm sm:text-base"
                  >
                    We sent a 6-digit code to your inbox
                  </motion.p>
                </motion.div>

                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="6 digit code"
                      className="w-full text-center font-mono text-xl sm:text-2xl md:text-3xl tracking-widest py-6 sm:py-8 rounded-3xl bg-gradient-to-r from-white/70 via-white/80 to-white/60 backdrop-blur-md border-2 border-slate-200/50 hover:border-accent-300/70 focus:border-accent-400 focus:ring-4 focus:ring-accent-400/40 shadow-2xl hover:shadow-accent-200/30 focus:shadow-glow-accent transition-all duration-500 letter-spacing-8 font-bold text-slate-800"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />
                    {otp.length === 6 && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-accent-500/90 to-teal-500/90 rounded-3xl flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Shield className="w-8 h-8 text-white drop-shadow-lg" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                    className="group relative w-full py-4 px-6 bg-white/60 backdrop-blur-sm border-2 border-slate-200/70 hover:border-slate-400 hover:bg-slate-50/80 text-slate-700 font-bold text-base sm:text-lg rounded-2xl shadow-lg hover:shadow-xl active:translate-y-px transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                      ← Back to Email
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={loading || otp.length !== 6}
                    onClick={verifyOtpHandler}
                    className="group relative w-full flex items-center justify-center gap-3 py-6 px-8 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 hover:from-accent-600 hover:via-accent-700 hover:to-accent-800 text-white font-black text-lg sm:text-xl rounded-2xl shadow-2xl hover:shadow-glow-accent active:shadow-xl active:translate-y-px transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent -skew-y-6 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                    {loading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                        <span className="tracking-wide">Sign In Securely</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">ReviewSlot Booking System</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
