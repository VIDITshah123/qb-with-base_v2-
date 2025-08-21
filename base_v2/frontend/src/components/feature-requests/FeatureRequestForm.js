import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { featureRequestAPI } from '../../services/api';
import { toast } from 'react-toastify';

const FeatureRequestForm = () => {
  const [formData, setFormData] = useState({
    main_function: '',
    sub_function: '',
    feature_name: '',
    feature_description: '',
    benefits: '',
    priority: 'Medium',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await featureRequestAPI.createRequest(formData);
      toast.success('Feature request submitted successfully!');
      setFormData({
        main_function: '',
        sub_function: '',
        feature_name: '',
        feature_description: '',
        benefits: '',
        priority: 'Medium',
      });
    } catch (error) {
      // Error is already handled by the interceptor in api.js
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Submit a New Feature Request
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="main_function"
            label="Main Function"
            name="main_function"
            value={formData.main_function}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="sub_function"
            label="Sub-Function (Optional)"
            name="sub_function"
            value={formData.sub_function}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="feature_name"
            label="Feature Name"
            name="feature_name"
            value={formData.feature_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            multiline
            rows={4}
            id="feature_description"
            label="Feature Description"
            name="feature_description"
            value={formData.feature_description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="benefits"
            label="Benefits (Optional)"
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              id="priority"
              name="priority"
              value={formData.priority}
              label="Priority"
              onChange={handleChange}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Submit Request
      </Button>
    </Box>
  );
};

export default FeatureRequestForm;
