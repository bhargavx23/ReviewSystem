import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";
import { showToast } from "../components/Toaster";
import { authAPI } from "../services/api";
import { cn } from "../utils/utils"; // clsx + tailwind-merge helper

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="glass-card p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-200 mb-2">
              ReviewSlot Login
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enter email/roll no to receive OTP
            </p>
          </div>

          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Email or Roll Number
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="example@college.edu or 21CS001"
                    className="input input-bordered w-full input-lg"
                    value={emailOrRollNo}
                    onChange={(e) => setEmailOrRollNo(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary w-full text-lg py-3 transform-hover"
                  onClick={sendOtpHandler}
                  disabled={loading || !emailOrRollNo.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  OTP sent to <span className="font-mono">{emailOrRollNo}</span>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Enter 6-digit OTP
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="input input-bordered w-full input-lg text-center tracking-[8px] font-mono text-xl"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn btn-ghost flex-1 text-lg"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary flex-1 text-lg transform-hover"
                    onClick={verifyOtpHandler}
                    disabled={otp.length !== 6 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          DVR & DR.HS MIC College of Technology
        </p>
      </div>
    </div>
  );
};

export default Login;
