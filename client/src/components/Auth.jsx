import { useState } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('mario.rossi@email.com');
  const [password, setPassword] = useState('admin');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    if (!username) {
      setErrorMessage('Username cannot be empty');
    } else if (!password) {
      setErrorMessage('Password cannot be empty');
    } else {
      props.login(credentials)
        .then(() => navigate("/"))
        .catch((err) => {
          setErrorMessage(err.error);
        });
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px', padding: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <h1 className="text-center pb-3">Login</h1>
          <Form onSubmit={handleSubmit}>
            {errorMessage ? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={username} placeholder="Example: name.surname@email.com"
                onChange={(ev) => setUsername(ev.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password} placeholder="Enter your password"
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </Form.Group>
            <Button className="w-100 mt-3" type="submit">Login</Button>
          </Form>
          <Button className="w-100 mt-3" variant="secondary" onClick={() => navigate('/')}>Home</Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

function LogoutButton(props) {
  return (
    <Button variant="danger" onClick={props.logout}>Logout</Button>
  );
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
  );
}

export { LoginForm, LogoutButton, LoginButton };
