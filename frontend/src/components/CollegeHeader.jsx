import React from 'react';
import { motion } from 'framer-motion';

const CollegeHeader = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card py-6 mb-8 rounded-2xl shadow-xl border-b-4 border-primary/30"
    >
      <div className="flex justify-center px-4">
        <motion.img
          src="/micLogo.jpeg"
          alt="DVR & DR.HS MIC College of Technology"
          className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl h-auto rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer object-contain drop-shadow-xl hover:scale-105"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          draggable={false}
        />
      </div>
      <div className="text-center mt-4">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-lg">
          College of Technology
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 font-medium">
          Project Review Slot Booking System
        </p>
      </div>
    </motion.header>
  );
};

export default CollegeHeader;

