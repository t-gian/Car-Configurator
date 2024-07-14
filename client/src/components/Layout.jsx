import { Container, Row, Col, Alert, Button, Toast, ToastContainer } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Navigation } from './Navigation';
import { LoginForm } from './Auth';
import { ModelList } from './ModelList';
import { AccessoryList } from './AccessoryList';
import { AccessoryListWithConstraints } from './AccessoryListWithConstraints';
import { Configuration } from './ConfigurationDetails';
import { useEffect, useState } from 'react';
import API from '../API.js';

function NotFoundLayout(props) {
  return (
    <Container>
      <Row className="justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Col xs={12} md={8} lg={6} className="text-center">
          <h2>This route is not valid!</h2>
          <Link to="/">
            <Button variant="primary">Go back to the main page!</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

function LoginLayout(props) {
  return (
    <Row>
      <Col>
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}
// In order to avoid a GET that could fail fetch the configuration only if boolean user.hasConfig  is true
// if no hasConfig set initial configuration states to null
// user will be exploited as the major state for the React logic.
function GenericLayout(props) {
  const [newConfiguration, setNewConfiguration] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
          const config = await API.getConfigurationById(props.user.id);
            props.setConfiguration(config);
            props.setSelectedModel(config.carModelId);
            props.setSelectedAccessories(config.accessoryIds);
            setErrorMessage('');
      } catch (err) {
        setErrorMessage(err.message);
      }
    };
    if (props.loggedIn && props.user.hasConfig) {
      fetchConfiguration();
    }
    else if (props.loggedIn && !props.user.hasConfig){
      props.setConfiguration(null);
      props.setSelectedModel(null);
      props.setSelectedAccessories([]);
    }
  }, [props.user]);

  return (
    <>
    <ToastContainer position="top-end" className="p-3">
        {errorMessage && (
          <Toast onClose={() => setErrorMessage('')} show={true} delay={3000} autohide bg="danger">
            <Toast.Header>
              <strong className="me-auto">Error Fetching</strong>
            </Toast.Header>
            <Toast.Body>{errorMessage}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
      <Row>
        <Col>
          <Navigation loggedIn={props.loggedIn} user={props.user} logout={props.logout} />
        </Col>
      </Row>
      <Row>
        <Col>
          {props.message ? (
            <Alert className='my-1' onClose={() => props.setMessage('')} variant='danger' dismissible>
              {props.message}
            </Alert>
          ) : null}
        </Col>
        
      </Row>
      <Row>
        {props.loggedIn ? (
          <>
            <Col md={7}>
              <ModelList
                loggedIn={props.loggedIn}
                modelsList={props.modelsList}
                setModelsList={props.setModelsList}
                selectedAccessories={props.selectedAccessories}
                user = {props.user}
                newConfiguration={newConfiguration}
                selectedModel={props.selectedModel}
                setSelectedModel={props.setSelectedModel}
                configuration={props.configuration}
              />
              <AccessoryListWithConstraints
                accessoriesListWithConstraints={props.accessoriesListWithConstraints}
                setAccessoriesListWithConstraints={props.setAccessoriesListWithConstraints}
                selectedAccessories={props.selectedAccessories}
                setSelectedAccessories={props.setSelectedAccessories}
                selectedModel={props.selectedModel}
                configuration={props.configuration}
              />
            </Col>
            <Col md={5}>
              <Configuration
                user = {props.user}
                setUser = {props.setUser}
                newConfiguration={newConfiguration}
                setNewConfiguration = {setNewConfiguration}
                selectedModel={props.selectedModel}
                selectedAccessories={props.selectedAccessories}
                setSelectedAccessories={props.setSelectedAccessories}
                accessoriesListWithConstraints={props.accessoriesListWithConstraints}
                configuration={props.configuration}
                setConfiguration={props.setConfiguration}
                authToken={props.authToken} setAuthToken={props.setAuthToken} 
                estimation={props.estimation} setEstimation={props.setEstimation}
              />
            </Col>
          </>
        ) : (
          <>
            <Col>
              <ModelList modelsList={props.modelsList} setModelsList={props.setModelsList}
              user={props.user}
              newConfiguration={newConfiguration}
              selectedModel={props.selectedModel} setSelectedModel={props.setSelectedModel} />
              <AccessoryList accessoriesList={props.accessoriesList}
                setAccessoriesList={props.setAccessoriesList}
              />
            </Col>
          </>
        )}
      </Row>
    </>
  );
}

export { LoginLayout, GenericLayout, NotFoundLayout };
