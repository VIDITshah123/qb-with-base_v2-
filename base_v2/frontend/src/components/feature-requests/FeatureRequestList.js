import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Button, TextField } from '@mui/material';
import { featureRequestAPI } from '../../services/api';
import { toast } from 'react-toastify';

const FeatureRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await featureRequestAPI.getRequests();
        setRequests(response.data);
      } catch (error) {
        // Error is handled by the interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const updatedRequest = await featureRequestAPI.updateRequest(id, { status });
      setRequests(requests.map(req => (req.feature_request_id === id ? updatedRequest.data : req)));
      toast.success('Status updated successfully!');
    } catch (error) {
      // Error is handled by the interceptor
    }
  };

  const handleDenialReasonChange = async (id, denial_reason) => {
    try {
        const updatedRequest = await featureRequestAPI.updateRequest(id, { denial_reason });
        setRequests(requests.map(req => (req.feature_request_id === id ? updatedRequest.data : req)));
        toast.success('Denial reason updated successfully!');
      } catch (error) {
        // Error is handled by the interceptor
      }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Feature Requests
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="feature requests table">
          <TableHead>
            <TableRow>
              <TableCell>Feature Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Denial Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.feature_request_id}>
                <TableCell>{req.feature_name}</TableCell>
                <TableCell>{req.feature_description}</TableCell>
                <TableCell>{req.priority}</TableCell>
                <TableCell>
                  <Select
                    value={req.status}
                    onChange={(e) => handleStatusChange(req.feature_request_id, e.target.value)}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                  >
                    <MenuItem value="requested">Requested</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="denied">Denied</MenuItem>
                    <MenuItem value="under_implementation">Under Implementation</MenuItem>
                    <MenuItem value="implemented">Implemented</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  {req.status === 'denied' && (
                    <TextField
                      defaultValue={req.denial_reason}
                      onBlur={(e) => handleDenialReasonChange(req.feature_request_id, e.target.value)}
                      variant="standard"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FeatureRequestList;
