import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "./Toaster";
import { cn } from "../utils/utils";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.clear();
    showToast("Logged out successfully", "success");
    navigate("/login");
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  if (!role) return null;

  const getDashboardPath = (role) => {
    if (role === "admin" || role === "hod") return "/admin";
    return `/${role}`;
  };

  const menuItems = [
    {
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`,
      path: getDashboardPath(role),
      icon: User,
    },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card backdrop-blur-xl z-50 sticky top-0 border-b border-white/20 shadow-2xl"
    >
      {/* Desktop Navbar */}
      <div className="hidden lg:flex px-4 py-3 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-200 bg-primary-token">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-token">ReviewSlot</h1>
            <p className="text-xs text-white font-medium">
              Slot Booking System
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium text-base-content">
              {userName} (
              <span className="uppercase text-xs text-base-content/70">
                {role.toUpperCase()}
              </span>
              )
            </span>
          </div>

          {menuItems.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform-hover",
                isActive(item.path)
                  ? "bg-primary/20 text-primary shadow-md"
                  : "text-base-content/70 hover:bg-base-200",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.name}
            </motion.button>
          ))}

          <motion.button
            onClick={handleLogout}
            className="btn btn-outline btn-error px-6 gap-2 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg flex items-center justify-center bg-primary-token">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-primary-token">
                ReviewSlot
              </h2>
              <p className="text-xs opacity-75 text-base-content">{userName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-base-200 hover:bg-base-300 lg:hidden"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-base-100/95 backdrop-blur-xl border-t px-4 pb-4"
            >
              <div className="space-y-2 pt-4">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all flex items-center gap-3",
                      isActive(item.path)
                        ? "bg-primary/20 text-primary font-semibold"
                        : "hover:bg-base-200",
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </motion.button>
                ))}
                <motion.button
                  onClick={handleLogout}
                  className="w-full btn btn-error gap-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
