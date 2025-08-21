import React from 'react';
import { Container, Paper, Box } from '@mui/material';
import FeatureRequestList from '../../components/feature-requests/FeatureRequestList';

const FeatureRequestAdminPage = () => {
  return (
    <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        <Box p={3}>
          <FeatureRequestList />
        </Box>
      </Paper>
    </Container>
  );
};

export default FeatureRequestAdminPage;
