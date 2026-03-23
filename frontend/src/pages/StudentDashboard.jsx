import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
} from "@mui/material";
import { studentAPI } from "../services/api";

const StudentDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [myBatch, setMyBatch] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, myBatchRes] = await Promise.all([
        studentAPI.getAllBatches(),
        studentAPI.getMyBatch(),
      ]);
      setBatches(batchesRes.data);
      setMyBatch(myBatchRes.data.batch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBatchColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const handleBookSlot = async () => {
    try {
      await studentAPI.bookSlot({
        date: selectedDate,
        slotNumber: 1, // Simplified - add slot selector
      });
      setBookingOpen(false);
      fetchData();
      alert("Slot booked! Awaiting approval.");
    } catch (err) {
      alert(err.response.data.message || "Booking failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      <Typography variant="h6" gutterBottom>
        My Batch
      </Typography>
      {myBatch && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5">{myBatch.batchName}</Typography>
            <Typography>Project: {myBatch.projectTitle}</Typography>
            <Typography>Guide: {myBatch.guideId?.name}</Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" gutterBottom>
        All Batches
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {batches.map((batch) => (
          <Grid item xs={12} sm={6} md={4} key={batch._id}>
            <Card className={`card status-${batch.status}`}>
              <CardContent>
                <Typography variant="h6">{batch.batchName}</Typography>
                <Typography>{batch.projectTitle}</Typography>
                <Chip
                  label={batch.status}
                  color={getBatchColor(batch.status)}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Booking Modal */}
      <Dialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book Slot</DialogTitle>
        <DialogContent>
          <Typography>
            Selected Date:{" "}
            {selectedDate && new Date(selectedDate).toLocaleDateString()}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Slot 1-10 available. Will be assigned first available.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingOpen(false)}>Cancel</Button>
          <Button onClick={handleBookSlot} variant="contained">
            Book Slot
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDashboard;
