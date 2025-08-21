import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { userAPI } from '../../services/api';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getUserById(userId);
        setUser(response.data);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading user profile...</p>
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!user) {
    return <Alert variant="warning">User not found.</Alert>;
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h2>User Profile</h2>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <h4>{user.first_name} {user.last_name}</h4>
              <p className="text-muted">{user.role.role_name}</p>
            </Col>
            <Col md={8}>
              <h5>Email</h5>
              <p>{user.user_email}</p>
              <h5>Mobile</h5>
              <p>{user.mobile_number || 'N/A'}</p>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col>
              <h5>Permissions</h5>
              {user.permissions && user.permissions.length > 0 ? (
                <ul>
                  {user.permissions.map(permission => (
                    <li key={permission.permission_id}>{permission.permission_name}</li>
                  ))}
                </ul>
              ) : (
                <p>No permissions assigned.</p>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserProfile;
