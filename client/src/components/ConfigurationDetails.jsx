import { useState, useEffect } from 'react';
import { Card, Badge, Table, Button, Tooltip, OverlayTrigger, Row, Container, Toast, ToastContainer } from 'react-bootstrap';
import './Configuration.css';
import API from '../API.js';

const Configuration = (props) => {
  const [selectedAccessoriesDetails, setSelectedAccessoriesDetails] = useState([]);
  const [selectedAccessoriesCount, setSelectedAccessoriesCount] = useState(0);
  const [accessoriesCost, setAccessoriesCost] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedAccessories, setSavedAccessories] = useState([]);
  const [fetchedAccessories, setFetchedAccessories] = useState([]);

  // manages the selected accessories by the user (at start time if any fetched, if not it's empty)
  // selectedAccessoriesDetail for tooltips and rendering more information regarding the selected accessories

  useEffect(() => {
    const selected = props.selectedAccessories.map((accId) =>
      props.accessoriesListWithConstraints.find((acc) => acc.id === accId)
    ).filter(Boolean);

    setSelectedAccessoriesDetails(selected);
    setSelectedAccessoriesCount(selected.length);
    const totalCost = selected.reduce((sum, accessory) => {
      const price = accessory.price || 0;
      return sum + price;
    }, 0);
    setAccessoriesCost(totalCost);
  }, [props.selectedAccessories]);
  //each time selected accessroies change set again the selectedAccessoriesDETAILS (for better info) and Count (constraint checking and badge)
  useEffect(() => {
    setIsSaveDisabled(props.user.hasConfig);
    setIsUpdateDisabled(!props.user.hasConfig);
    setIsDeleteDisabled(!props.user.hasConfig);
  }, [props.user.hasConfig]);
  // states to enable /disable save/config/delete based on the given user configuration

   //at render, if any saved set the savedAccessories (used for the estimation) as estimation only performed on fetched / newly saved config
   useEffect(() => {
    if (props.user.hasConfig) {
      const selectedAccessoryNames = props.selectedAccessories.map((accId) => {
        const accessory = props.accessoriesListWithConstraints.find((acc) => acc.id === accId);
        return accessory ? accessory.name : null;
      }).filter(Boolean);

      setSavedAccessories(selectedAccessoryNames);
    }
  }, []);

  //logic for setting token when expired to get estimation
  useEffect(() => {
    if (savedAccessories) {
      if (props.authToken) {
        if (Array.isArray(savedAccessories)) {
          API.getEstimation(props.authToken, savedAccessories.map(acc => acc.name))
            .then(estimation => props.setEstimation(estimation.days))
            .catch(err => {
              props.setEstimation({});
              API.getAuthToken()
                .then(resp => props.setAuthToken(resp.token));
            });
        }
      }
    }
}, [savedAccessories, props.authToken]);

// in order to check if it's needed to update or not a configuration (if there are no changes in the accessoriesList given the same model, then no need to update)
useEffect(() => {
  if (props.user.hasConfig) {
    const selected = props.selectedAccessories.map((accId) =>
      props.accessoriesListWithConstraints.find((acc) => acc.id === accId)
    ).filter(Boolean);

    setFetchedAccessories(selected);
  }
}, [props.configuration]);

const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value) => arr2.includes(value));
};

  const handleRemoveAccessory = (accessoryId) => {
    if (!isRemoveDisabled(accessoryId).disabled) {
      const updatedAccessories = props.selectedAccessories.filter((id) => id !== accessoryId);
      props.setSelectedAccessories(updatedAccessories);
    }
  };

  const isRemoveDisabled = (accessoryId) => {
    const dependentAccessory = props.accessoriesListWithConstraints.find(
      (acc) => acc.requiredAccessoryId === accessoryId
    );
    if (dependentAccessory && props.selectedAccessories.includes(dependentAccessory.id)) {
      return { disabled: true, message: `Required by ${dependentAccessory.name}` };
    }
    return { disabled: false, message: 'Press to remove' };
  };

  const maxAccessoriesCount = props.selectedModel?.maxNumAccessories || 0;

  const accessoriesBadgeText = selectedAccessoriesCount < maxAccessoriesCount 
    ? "Maximum number of accessories not reached" 
    : "Maximum number of accessories reached";

  const accessoriesBadgeVariant = selectedAccessoriesCount < maxAccessoriesCount ? 'success' : 'danger';

  const handleSaveConfiguration = async () => {
    try {
      const result = await API.saveNewConfig(props.user.id, props.selectedModel.id, props.selectedAccessories);
      const updatedUser = { ...props.user, hasConfig: 1 };
      props.setUser(updatedUser);
      setIsSaveDisabled(true);
      setIsUpdateDisabled(false);
      setIsDeleteDisabled(false);
      setSuccessMessage('Configuration saved successfully.');
      setErrorMessage('');
      const selectedAccessoryNames = props.selectedAccessories.map((accId) => {
        const accessory = props.accessoriesListWithConstraints.find((acc) => acc.id === accId);
        return accessory ? accessory.name : null;
      }).filter(Boolean);
      setSavedAccessories(selectedAccessoryNames);
      const selected = props.selectedAccessories.map((accId) =>
        props.accessoriesListWithConstraints.find((acc) => acc.id === accId)
      ).filter(Boolean);
  
      setFetchedAccessories(selected);
    } catch (error) {
      setErrorMessage('Error saving configuration: ' + error.message);
      setSuccessMessage('');
    }
  };

  const handleUpdateConfiguration = async () => {
    try {
      const result = await API.updateConfig(props.user.id, props.selectedModel.id, props.selectedAccessories);
      const updatedUser = { ...props.user, hasConfig: 1 };
      props.setUser(updatedUser);
      setSuccessMessage('Configuration updated successfully.');
      setErrorMessage('');
      const selectedAccessoryNames = props.selectedAccessories.map((accId) => {
        const accessory = props.accessoriesListWithConstraints.find((acc) => acc.id === accId);
        return accessory ? accessory.name : null;
      }).filter(Boolean);
      setSavedAccessories(selectedAccessoryNames);
      const selected = props.selectedAccessories.map((accId) =>
        props.accessoriesListWithConstraints.find((acc) => acc.id === accId)
      ).filter(Boolean);
  
      setFetchedAccessories(selected);
    } catch (error) {
      
      setErrorMessage('Error updating configuration: ' + error.message);
      setSuccessMessage('');
    }
  };

  const handleDeleteConfiguration = async () => {
    try {
      const result = await API.deleteConfig(props.user.id);
      const updatedUser = { ...props.user, hasConfig: 0 };
      props.setUser(updatedUser);
      setIsSaveDisabled(false);
      setIsUpdateDisabled(true);
      setIsDeleteDisabled(true);
      props.setNewConfiguration(null);
      setSuccessMessage('Configuration deleted successfully.');
      setErrorMessage('');
    } catch (error) {
      
      setErrorMessage('Error deleting configuration: ' + error.message);
      setSuccessMessage('');
    }
  };

  // the Cancel button behaves like a reset accessories selected (this what I got from the text)
  // the model will remain fixed if the user has a configuration saved, if not the user will be free to select another model also
  // pure cancel logic 
  const handleCancelConfiguration = () => {
    props.setSelectedAccessories([]);
  };

  if (!props.configuration && props.newConfiguration === null) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '100%', maxWidth: '400px', height: "100%", padding: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <Card.Body>
            <h1 className="text-center pb-3">No Configuration Defined</h1>
            <Button variant="success custom-button" onClick={() => props.setNewConfiguration({ userId: props.user.id })}>
              Start New Configuration
            </Button>
          </Card.Body>
        </Card>
        <ToastContainer position="top-end" className="p-3">
          {successMessage && (
            <Toast onClose={() => setSuccessMessage('')} show={true} delay={3000} autohide bg="success">
              <Toast.Header>
                <strong className="me-auto">Success</strong>
              </Toast.Header>
              <Toast.Body>{successMessage}</Toast.Body>
            </Toast>
          )}
          {errorMessage && (
            <Toast onClose={() => setErrorMessage('')} show={true} delay={3000} autohide bg="danger">
              <Toast.Header>
                <strong className="me-auto">Error</strong>
              </Toast.Header>
              <Toast.Body>{errorMessage}</Toast.Body>
            </Toast>
          )}
        </ToastContainer>
      </Container>
    );
  };

  return (
    <>
      <Row className="justify-content-center">
        <ToastContainer position="top-end" className="p-3">
          {successMessage && (
            <Toast onClose={() => setSuccessMessage('')} show={true} delay={3000} autohide bg="success">
              <Toast.Header>
                <strong className="me-auto">Success</strong>
              </Toast.Header>
              <Toast.Body>{successMessage}</Toast.Body>
            </Toast>
          )}
          {errorMessage && (
            <Toast onClose={() => setErrorMessage('')} show={true} delay={3000} autohide bg="danger">
              <Toast.Header>
                <strong className="me-auto">Error</strong>
              </Toast.Header>
              <Toast.Body>{errorMessage}</Toast.Body>
            </Toast>
          )}
        </ToastContainer>
        {props.selectedModel ? (
          <>
            <h2 className="mt-4">Your Configuration</h2>
           
            <Card className="my-3 shadow-sm custom-card-model">
              <Card.Body>
              {props.user.hasConfig && props.estimation ? (
  <Badge bg="info" text="light" className="estimation-badge">
    Estimated Delivery: {Number.parseFloat(props.estimation)} days
  </Badge>
): null }

                <Card.Title>Model Information</Card.Title>
                <div className="card-info">
                  <strong>Name:</strong> {props.selectedModel.name} <br />
                  <strong>Engine Power:</strong> {props.selectedModel.engine} kW <br />
                  <strong>Starting Car Cost:</strong> {props.selectedModel.cost?.toLocaleString()} € <br />
                  <strong>Max Accessories:</strong> {props.selectedModel.maxNumAccessories}
                  <br />
                  <Badge bg={accessoriesBadgeVariant} text="light" className="accessories-badge">
                    {accessoriesBadgeText}
                  </Badge>
                </div>
                <Badge bg="primary" text="light" className="total-cost-badge">
                  <strong>Total Cost: {(props.selectedModel.cost + accessoriesCost).toLocaleString()} €</strong>
                </Badge>
              </Card.Body>
            </Card>
            
          </>
        ) : (
          <>
            <h2 className="mt-4">Your Configuration</h2>
            <Card className="my-3 shadow-sm custom-card-model custom-border-yellow">
              <Card.Body>
                <Card.Title>Model Information</Card.Title>
                <div className="card-info">
                  <strong>Name:</strong> {'No Model Selected'} <br />
                  <strong>Engine Power:</strong> {'N/A'} kW <br />
                  <strong>Starting Car Cost:</strong> {'N/A'} € <br />
                  <strong>Max Accessories:</strong> {'N/A'}
                  <br />
                  <Badge bg="warning" text="light" className="select-model-badge">
                    Select a Model
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
      </Row>
      <Row className="justify-content-center">
        {selectedAccessoriesDetails.length > 0 && props.selectedModel ? (
          <Card className="my-3 shadow-sm custom-card-model">
            <Card.Body>
              <h2 className="mt-1">Your Accessories</h2>
              <Table striped bordered hover className="mt-4 custom-table">
                <thead>
                  <tr>
                    <th>Accessory Name</th>
                    <th>Accessory Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAccessoriesDetails.map((accessory) => (
                    <tr key={accessory.id}>
                      <td>{accessory.name || 'N/A'}</td>
                      <td>{accessory.price?.toLocaleString() || 'N/A'} €</td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip id={`tooltip-remove-${accessory.id}`}>{isRemoveDisabled(accessory.id).message}</Tooltip>}
                        >
                          <span className="remove-button">
                            <Button
                              variant="danger"
                              onClick={() => handleRemoveAccessory(accessory.id)}
                              disabled={isRemoveDisabled(accessory.id).disabled}
                              size="sm"
                            >
                              Remove
                            </Button>
                          </span>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="button-group">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-save">{isSaveDisabled ? 'You can update your configuration' : 'Press to save new configuration'}</Tooltip>}
                >
                  <span className="d-inline-block">
                    <Button
                      variant="success"
                      onClick={handleSaveConfiguration}
                      className='mx-2'
                      disabled={isSaveDisabled}
                    >
                      Save Configuration
                    </Button>
                  </span>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-update">
                    {isUpdateDisabled ? 'You can save your new configuration' : 
                      arraysEqual(props.selectedAccessories, fetchedAccessories.map(acc => acc.id)) ? 
                      'No changes to update' : 
                      'Press to update your saved configuration'}
                  </Tooltip>}
>
                  <span className="d-inline-block">
                    <Button
                      variant="primary"
                      onClick={handleUpdateConfiguration}
                      className='mx-2'
                      disabled={isUpdateDisabled || arraysEqual(props.selectedAccessories, fetchedAccessories.map(acc => acc.id))}
                    >
                      Update Configuration
                    </Button>
                  </span>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-delete">{isDeleteDisabled ? 'No configuration to delete' : 'Press to permanently delete your configuration'}</Tooltip>}
                >
                  <span className="d-inline-block">
                    <Button
                      variant="danger"
                      onClick={handleDeleteConfiguration}
                      className='mx-2'
                      disabled={isDeleteDisabled}
                    >
                      Delete Configuration
                    </Button>
                  </span>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-cancel">Press to cancel configuration</Tooltip>}
                >
                  <span className="d-inline-block">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancelConfiguration}
                      className='mx-2'
                      disabled={!props.selectedAccessories.length}
                    >
                      Cancel Configuration
                    </Button>
                  </span>
                </OverlayTrigger>
              </div>
              
            </Card.Body>
          </Card>
        ) : (
          props.selectedModel ? (
            <Card className="my-3 shadow-sm custom-card-model custom-border-yellow">
              <Card.Body>
                <h2 className="mt-1">Your Accessories</h2>
                <div className="custom-no-configuration">
                  <h4>No Accessories Selected</h4>
                  <p>Select accessories to add to your configuration or save the configuration without accessories.</p>
                  <div className="button-group">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id="tooltip-save">{isSaveDisabled ? 'You can update your configuration' : 'Press to save new configuration without accessories'}</Tooltip>}
                    >
                      <span className="d-inline-block">
                        <Button
                          variant="success"
                          onClick={handleSaveConfiguration}
                          className='mx-2'
                          disabled={isSaveDisabled}
                        >
                          Save Configuration without accessories
                        </Button>
                      </span>
                    </OverlayTrigger>
                    <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-update">
                    {isUpdateDisabled ? 'First save a new configuration' : 
                      arraysEqual(props.selectedAccessories, fetchedAccessories.map(acc => acc.id)) ? 
                      'No changes to update' : 
                      'Press to update your saved configuration'}
                  </Tooltip>} >
                      <span className="d-inline-block">
                        <Button
                          variant="primary"
                          onClick={handleUpdateConfiguration}
                          className='mx-2'
                          disabled={isUpdateDisabled || arraysEqual(props.selectedAccessories, fetchedAccessories.map(acc => acc.id))}
                          
                        >
                          Update Configuration
                        </Button>
                      </span>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip id="tooltip-delete">{isDeleteDisabled ? 'No configuration to delete' : 'Press to permanently delete your configuration'}</Tooltip>}
                    >
                      <span className="d-inline-block">
                        <Button
                          variant="danger"
                          onClick={handleDeleteConfiguration}
                          className='mx-2'
                          disabled={isDeleteDisabled}
                        >
                          Delete Configuration
                        </Button>
                      </span>
                    </OverlayTrigger>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <>
              <h2 className="mt-4">Your Accessories</h2>
              <div className="custom-no-configuration custom-border-yellow">
                <h4>No Accessories Selected</h4>
                <p>Select a model before adding accessories to your configuration.</p>
              </div>
            </>
          )
        )}
      </Row>
    </>
  );
};

export { Configuration };
