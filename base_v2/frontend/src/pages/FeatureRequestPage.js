import React from 'react';
import { Container, Paper, Box } from '@mui/material';
import FeatureRequestForm from '../components/feature-requests/FeatureRequestForm';

const FeatureRequestPage = () => {
  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <FeatureRequestForm />
        </Box>
      </Paper>
    </Container>
  );
};

export default FeatureRequestPage;
