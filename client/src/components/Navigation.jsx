import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LoginButton, LogoutButton } from './Auth';

const Navigation = (props) => {
    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="navbar-padding">
            <Container fluid>
                <Navbar.Brand className="d-flex align-items-center">
                    <i className="bi bi-car-front-fill me-2" style={{ fontSize: '1.5rem' }} />
                    <span className="fs-4">Car Configurator</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav className="align-items-center">
                        {props.user && props.user.name && (
                            <Navbar.Text className="me-3 fs-5 text-white">
                                Logged in as: {props.user.name}
                            </Navbar.Text>
                        )}
                        <div className="me-3">
                            {props.loggedIn ? (
                                <LogoutButton logout={props.logout} />
                            ) : (
                                <LoginButton />
                            )}
                        </div>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export { Navigation };
