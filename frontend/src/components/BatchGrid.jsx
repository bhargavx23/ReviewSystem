import React from "react";
import { Grid, Card, CardContent, Typography, Chip } from "@mui/material";

const BatchGrid = ({ batches, onBatchClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      default:
        return "error";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "✅ Approved";
      case "pending":
        return "⏳ Pending";
      default:
        return "🔴 Not Booked";
    }
  };

  return (
    <Grid container spacing={3}>
      {batches.map((batch) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={batch._id}>
          <Card
            className={`card status-${batch.status}`}
            onClick={() => onBatchClick(batch)}
            sx={{ cursor: "pointer", height: "100%" }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {batch.batchName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {batch.projectTitle}
              </Typography>
              <Chip
                label={getStatusLabel(batch.status)}
                color={getStatusColor(batch.status)}
                sx={{ mt: 1 }}
              />
              {batch.teamLeaderName && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Leader: {batch.teamLeaderName}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default BatchGrid;
