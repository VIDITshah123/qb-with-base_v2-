import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const PricingPage = () => {
  return (
    <Container className="my-5">
      <Row className="text-center mb-5">
        <Col>
          <h1>Our Pricing Plans</h1>
          <p className="lead">Choose the plan that's right for you.</p>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="my-0 fw-normal">Free</h4>
            </Card.Header>
            <Card.Body>
              <Card.Title as="h1" className="my-0">
                $0 <small className="text-muted fw-light">/ mo</small>
              </Card.Title>
              <ul className="list-unstyled mt-3 mb-4">
                <li>10 users included</li>
                <li>2 GB of storage</li>
                <li>Email support</li>
                <li>Help center access</li>
              </ul>
              <Button variant="outline-primary" className="w-100">Sign up for free</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="my-0 fw-normal">Pro</h4>
            </Card.Header>
            <Card.Body>
              <Card.Title as="h1" className="my-0">
                $15 <small className="text-muted fw-light">/ mo</small>
              </Card.Title>
              <ul className="list-unstyled mt-3 mb-4">
                <li>20 users included</li>
                <li>10 GB of storage</li>
                <li>Priority email support</li>
                <li>Help center access</li>
              </ul>
              <Button variant="primary" className="w-100">Get started</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4 border-primary">
            <Card.Header className="bg-primary text-white">
              <h4 className="my-0 fw-normal">Enterprise</h4>
            </Card.Header>
            <Card.Body>
              <Card.Title as="h1" className="my-0">
                $29 <small className="text-muted fw-light">/ mo</small>
              </Card.Title>
              <ul className="list-unstyled mt-3 mb-4">
                <li>30 users included</li>
                <li>15 GB of storage</li>
                <li>Phone and email support</li>
                <li>Help center access</li>
              </ul>
              <Button variant="primary" className="w-100">Contact us</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PricingPage;
