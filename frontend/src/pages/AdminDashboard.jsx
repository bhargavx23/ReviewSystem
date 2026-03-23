import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { adminAPI } from "../services/api";
// import { generateReport } from "../../backend/utils/reports"; // Backend utils not needed in FE

const AdminDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    role: "guide",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bookingsRes = await adminAPI.getBookings();
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      await adminAPI.createUser(formData);
      setOpen(false);
      setFormData({ name: "", email: "", rollNo: "", role: "guide" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const statusColor = (status) => {
    return status === "approved"
      ? "success"
      : status === "pending"
        ? "warning"
        : "error";
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard (HOD)
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h4">{batches.length}</Typography>
              <Typography>Total Batches</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h4">
                {bookings.filter((b) => b.status === "approved").length}
              </Typography>
              <Typography>Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="h4">
                {bookings.filter((b) => b.status === "pending").length}
              </Typography>
              <Typography>Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Bookings
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Slot</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.batchId?.batchName}</TableCell>
                      <TableCell>
                        {new Date(booking.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{booking.slotNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={statusColor(booking.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" color="error">
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setOpen(true)}
                sx={{ mb: 2 }}
              >
                Add User
              </Button>
              <Button fullWidth variant="outlined" sx={{ mb: 2 }}>
                Add Batch
              </Button>
              <Button fullWidth variant="contained" color="secondary">
                Assign Guides
              </Button>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                Download Report (PDF)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Roll No"
            value={formData.rollNo}
            onChange={(e) =>
              setFormData({ ...formData, rollNo: e.target.value })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
