import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import API from './API.js';
import { React, useState, useEffect } from 'react';
import { Container} from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GenericLayout, LoginLayout, NotFoundLayout } from './components/Layout';


function App() {
  return (
    <BrowserRouter>
      <AppWithRouter />
    </BrowserRouter>
  );
}

function AppWithRouter(props) {  

  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(undefined);
  const [estimation, setEstimation] = useState({});
  const [message, setMessage] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsList, setModelsList] = useState([]);
  const [accessoriesList, setAccessoriesList] = useState([]);
  const [accessoriesListWithConstraints, setAccessoriesListWithConstraints] = useState([]);
  const [configuration, setConfiguration] = useState(null);

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        API.getAuthToken().then((resp) => { setAuthToken(resp.token); })
      } catch(err) {
        // NO need to do anything: user is simply not yet authenticated
        //handleError(err);
      }
    };
    checkAuth();

  }, []); 
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      renewToken();
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };


  const renewToken = () => {
    API.getAuthToken().then((resp) => { setAuthToken(resp.token); } )
    .catch(err => {setMessage(err)});
  }

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setUser(null);
    setModelsList([]);
    setAccessoriesList([]);
    setSelectedAccessories([]);
    setAccessoriesListWithConstraints([]);
    setSelectedModel(null);
    setAuthToken(undefined);
    setConfiguration(null);
    setEstimation({});
    setMessage('');
  };



      return (
        <Container fluid>
          <Routes>
          <Route path="/" element={<GenericLayout loggedIn={loggedIn} user={user} setUser ={setUser} logout={handleLogout}
           message={message} setMessage={setMessage} modelsList={modelsList} setModelsList={setModelsList}
           accessoriesList={accessoriesList} setAccessoriesList={setAccessoriesList}
           accessoriesListWithConstraints={accessoriesListWithConstraints} setAccessoriesListWithConstraints={setAccessoriesListWithConstraints}
           selectedAccessories={selectedAccessories} setSelectedAccessories={setSelectedAccessories}
           selectedModel={selectedModel} setSelectedModel={setSelectedModel}
           configuration={configuration} setConfiguration={setConfiguration}
           authToken={authToken} setAuthToken={setAuthToken} 
           estimation={estimation} setEstimation={setEstimation}  /> } />
          <Route path="*" element={<NotFoundLayout />} />
            <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin} /> : <Navigate replace to='/' />} />
        </Routes>
      </Container>
  );
}

export default App;

