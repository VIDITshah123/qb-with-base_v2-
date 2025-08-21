import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const RoleDashboard = () => {
  const { roleName } = useParams();

  return (
    <Container fluid>
      <h1 className="h3 mb-4 text-gray-800 text-capitalize">{roleName} Dashboard</h1>
      <Row>
        {[1, 2, 3, 4].map((card) => (
          <Col xl={3} md={6} className="mb-4" key={card}>
            <Card className="border-left-primary shadow h-100 py-2">
              <Card.Body>
                <Row className="no-gutters align-items-center">
                  <Col className="mr-2">
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Placeholder Card
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">Placeholder Content</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default RoleDashboard;
