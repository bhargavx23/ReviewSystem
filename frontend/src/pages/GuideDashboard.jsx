import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
} from "@mui/material";
import { guideAPI } from "../services/api";

const GuideDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, pendingRes] = await Promise.all([
        guideAPI.getBatches(),
        guideAPI.getPending(),
      ]);
      setBatches(batchesRes.data);
      setPendingBookings(pendingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await guideAPI.approveBooking(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await guideAPI.rejectBooking(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Guide Dashboard
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            My Assigned Batches ({batches.length})
          </Typography>
          {batches.map((batch) => (
            <Card sx={{ mb: 2, p: 2 }} key={batch._id}>
              <Typography variant="h6">{batch.batchName}</Typography>
              <Typography>Project: {batch.projectTitle}</Typography>
              <Typography>Team Leader: {batch.teamLeaderName}</Typography>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Slot Requests ({pendingBookings.length})
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Slot</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingBookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>{booking.batchId.batchName}</TableCell>
                  <TableCell>
                    {new Date(booking.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{booking.slotNumber}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApprove(booking._id)}
                      sx={{ mr: 1 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleReject(booking._id)}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Container>
  );
};

export default GuideDashboard;
