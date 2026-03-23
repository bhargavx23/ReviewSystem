import React from "react";
import { Box } from "@mui/material";

const CollegeHeader = () => {
  return (
    <Box
      sx={{
        py: { xs: 2, md: 3 },
        mb: 3,
        bgcolor: "white",
        borderBottom: "2px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", px: 2 }}>
        <Box
          component="img"
          src="/micLogo.jpeg"
          alt="DVR & DR.HS MIC College"
          sx={{
            width: { xs: "240px", sm: "320px", md: "400px", lg: "480px" },
            height: "auto",
            maxHeight: { xs: 70, sm: 90, md: 110 },
            display: "block",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))",
            objectFit: "contain",
          }}
        />
      </Box>
    </Box>
  );
};

export default CollegeHeader;
