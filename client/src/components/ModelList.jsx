import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Badge, Button, OverlayTrigger, Tooltip, Toast, ToastContainer } from 'react-bootstrap';
import API from '../API.js';
import './ModelList.css';

const ModelList = (props) => {
  // re-render the modelList at each login-logout and user.hasConfig overwritten.
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelsData = await API.getModels();
        props.setModelsList(modelsData);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Failed to communicate');
      }
    };
    fetchModels();
  }, [props.user]);

  // Update selected model based on current configuration (either selected one by user, saved one or null if no configuration started yet)
  useEffect(() => {
    const getSelectedModel = async () => {
      if (props.configuration) {
        const selectedModel = props.modelsList.find(model => model.id === props.configuration?.carModelId);
        props.setSelectedModel(selectedModel);
      } else {
        props.setSelectedModel(null);
      }
    };

    getSelectedModel();
  }, [props.configuration]); 

  
  const handleSelectModel = (model) => {
    if (props.configuration === null) {
      props.setSelectedModel(model);
    }
  };
  const getTooltipMessage = (model) => {
    if (props.configuration !== null) {
      return 'Model already selected';
    }
    if (props.selectedAccessories?.length > model.maxNumAccessories) {
      return 'Too many accessories selected';
    }
    if (props.newConfiguration === null && props.configuration === null){
      return 'Start configuration';
    }
    return 'Press to select';
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
      <h2 className="mt-4">Car Models</h2>
      <Row className="mt-4">
        {props.modelsList.map((model) => (
          <Col key={model.id} sm={12} md={6} lg={4} className="mb-4">
            <Card className={`custom-card ${props.selectedModel?.id === model.id ? 'selected-card' : ''}`}>
              <Card.Body>
                <Card.Title className="custom-card-title">{model.name}</Card.Title>
                <Card.Text>
                  <strong>Engine Power:</strong> {model.engine} kW<br />
                  <strong>Cost:</strong> <span className="cost"> {model.cost?.toLocaleString()} €</span><br />
                  <strong>Max Accessories:</strong> <Badge bg="success" text="light" className="max-accessories">{model.maxNumAccessories}</Badge>
                </Card.Text>
                {props.loggedIn && (
                   <OverlayTrigger
                   placement="bottom"
                   overlay={
                     <Tooltip id={`tooltip-${model.id}`}>
                       {getTooltipMessage(model)}
                     </Tooltip>
                   }>
                    <span className="d-inline-block">
                   
                  <Button
                    variant="primary"
                    onClick={() => handleSelectModel(model)}
                    disabled={props.configuration !== null || (props.newConfiguration === null && props.configuration === null) || (props.selectedAccessories?.length > model.maxNumAccessories)}
                    className='select-model-button'
                  >
                    {props.configuration !== null ? 'Model Selected' : 'Select Model'}
                  </Button>
                  </span>
                  </OverlayTrigger>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export { ModelList };
