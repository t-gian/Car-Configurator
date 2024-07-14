import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Badge, Toast, ToastContainer } from 'react-bootstrap';
import API from '../API.js';
import './AccessoryList.css';

const AccessoryList = (props) => {
  // each time a new configuration is saved, updated re-render again the accessory lists.
  // Moreover, props.configuration depends on props.user (hasConfig), therefore falso etch it log-in / log-out.
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        const accessoriesData = await API.getAccessories();
        props.setAccessoriesList(accessoriesData);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Failed to communicate');
      }
    };
    fetchAccessories();
  }, [props.configuration]); 

  const renderAvailabilityBadge = (availability) => {
    if (availability === 0) {
      return <Badge bg="danger">Out of stock</Badge>;
    } else {
      return <Badge bg="success" text="light">{availability}</Badge>;
    }
  };

  return (
    <>
    <ToastContainer position="top-end" className="p-3">
        {errorMessage && (
          <Toast onClose={() => setErrorMessage('')} show={true} delay={3000} autohide bg="danger">
            <Toast.Header>
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>{errorMessage}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
      <h2 className="mt-4">Accessories</h2>
      <Row className="mt-4">
        {props.accessoriesList.map((accessory) => (
          <Col key={accessory.id} sm={12} md={6} lg={4} className="mb-4">
            <Card className="custom-card">
              <Card.Body>
                <Card.Title className="custom-card-title">{accessory.name}</Card.Title>
                <Card.Text>
                  <strong>Price:</strong> <span className="price">{accessory.price?.toLocaleString()} €</span><br />
                  <strong>Availability:</strong> {renderAvailabilityBadge(accessory.availability)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export {AccessoryList};
