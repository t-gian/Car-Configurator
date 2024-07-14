import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Badge, OverlayTrigger, Tooltip, Button, Toast, ToastContainer  } from 'react-bootstrap';
import API from '../API.js';
import './AccessoryList.css';

const AccessoryListWithConstraints = (props) => {
  const [errorMessage, setErrorMessage] = useState('');
  // each time there's a configuration (saved, that is being created / updated) list of accessories with constraints is needed.
  // accessoriesListWithConstraints state being populated 
  useEffect(() => {
    const fetchAccessoriesWithConstraints = async () => {
      try {
        const accessoriesData = await API.getAccessoriesWithConstraints();
        props.setAccessoriesListWithConstraints(accessoriesData);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Failed to communicate');
      }
    };

    fetchAccessoriesWithConstraints();
  }, [props.configuration]);

  const renderAvailabilityBadge = (availability) => {
    if (availability === 0) {
      return <Badge bg="danger">Out of stock</Badge>;
    } else {
      return <Badge bg="success" text="light">{availability}</Badge>;
    }
  };

  const isAccessorySelected = (accessoryId) => {
    return props.selectedAccessories.includes(accessoryId);
  };

  const isSelectionDisabled = (accessory) => {
    if (!props.selectedModel) {
      return { disabled: true, message: 'Please select a car model first.' };
    }
    if (props.selectedAccessories.length >= props.selectedModel.maxNumAccessories) {
      return {
        disabled: true,
        message: `Maximum number of accessories (${props.selectedModel.maxNumAccessories}) reached.`,
      };
    }
    if (isAccessorySelected(accessory.id)) {
      return { disabled: true, message: 'Accessory already selected' };
    }
    if (accessory.incompatibleAccessoryId && isAccessorySelected(accessory.incompatibleAccessoryId)) {
      const incompatibleAccessory = props.accessoriesListWithConstraints.find(acc => acc.id === accessory.incompatibleAccessoryId);
      return { disabled: true, message: `Incompatible with ${incompatibleAccessory.name}` };
    }
    if (accessory.requiredAccessoryId && !isAccessorySelected(accessory.requiredAccessoryId)) {
      const requiredAccessory = props.accessoriesListWithConstraints.find(acc => acc.id === accessory.requiredAccessoryId);
      return { disabled: true, message: `Requires ${requiredAccessory.name}` };
    }
    if (props.configuration !== null && props.configuration !== undefined && accessory.availability === 0 && props.configuration.accessoryIds.find(acc => acc === accessory.id)) {
      return { disabled: false, message: 'You can reinsert it' };
    }
    if (accessory.availability === 0) {
      return { disabled: true, message: 'Out of stock' };
    }
    return { disabled: false, message: 'Press to select' };
  };

  // Security reason: double check if an accessory is selecteable (even if this was already selected) as the disabling of buttons might be buggy in borderline cases
  const handleSelectAccessory = (accessory) => {
    if (!isSelectionDisabled(accessory).disabled) {
      props.setSelectedAccessories([...props.selectedAccessories, accessory.id]);
    }
  };

  const renderTooltip = (requiredAccessoryName, incompatibleAccessoryName) => (
    <Tooltip id="tooltip">
      <strong>Required Accessory:</strong> {requiredAccessoryName || 'None'}<br />
      <strong>Incompatible Accessory:</strong> {incompatibleAccessoryName || 'None'}
    </Tooltip>
  );

  const getCardClassName = (accessory) => {
    return `custom-card ${isAccessorySelected(accessory.id) ? 'selected-card' : ''}`;
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
        {props.accessoriesListWithConstraints.map((accessory) => (
          <Col key={accessory.id} sm={12} md={6} lg={4} className="mb-4">
            <Card className={getCardClassName(accessory)}>
              <Card.Body>
                <Card.Title className="custom-card-title">{accessory.name}</Card.Title>
                <Card.Text>
                  <strong>Price:</strong> <span className="price">{accessory.price?.toLocaleString()} €</span><br />
                  <strong>Availability:</strong> {renderAvailabilityBadge(accessory.availability)}
                </Card.Text>
                <OverlayTrigger
                  placement="top-end"
                  overlay={renderTooltip(accessory.requiredAccessoryName, accessory.incompatibleAccessoryName)}
                >
                  <span className="info-icon">
                    <i className="bi bi-info-circle-fill"></i>
                  </span>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="right"
                  overlay={<Tooltip id={`tooltip-${accessory.id}`}>
                    {isSelectionDisabled(accessory).message}
                  </Tooltip>}
                >
                  <span className="select-button">
                    <Button
                      variant="primary"
                      onClick={() => handleSelectAccessory(accessory)}
                      disabled={isSelectionDisabled(accessory).disabled}
                    >
                      Select Accessory
                    </Button>
                  </span>
                </OverlayTrigger>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export { AccessoryListWithConstraints };
