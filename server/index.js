'use strict';

const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

const jwtSecret = '7b4e36d8f4b41d3f2bff77bfeebceba87d485d1490d77bc1fc4c1370a622a6a7';
const expireTime = 60; 

const config_dao = require('./dao-configurator'); 
const user_dao = require('./dao-users'); 

const app = new express();
const port = 3001;
app.use(morgan('dev'));
app.use(express.json());


const corsOption = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOption));


const passport = require('passport');
const LocalStrategy = require('passport-local');

passport.use(new LocalStrategy(async function verify(username, password, callback) {
    const user = await user_dao.getUser(username, password);
    if (!user) {
        return callback(null, false, 'Incorrect username or password')
    }

    return callback(null, user);
}));

passport.serializeUser(function (user, callback) {
    callback(null, user);
});

passport.deserializeUser(function (user, callback) {
    return callback(null, user);
});

const session = require('express-session');

app.use(session({
    secret: "91f32d047f488e9730178603e6a116ee",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: app.get('env') === 'production' }
}));

app.use(passport.authenticate('session'));


const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authorized' });
};


const errorFormatter =  ({ location, msg, param, value, nestedErrors }) => {
    return `${location}[${param}]: ${msg}`;
};


app.get('/api/models', (req, res) => {
    config_dao.listModels()
        .then(models => res.json(models))
        .catch((err) => res.status(500).json( {error: 'Error'}));
});

app.get('/api/accessories', (req, res) => {
    config_dao.listAccessories()
        .then(accessories => res.json(accessories))
        .catch((err) => res.status(500).json({ error: 'Error' }));
});

app.get('/api/accessories-with-constraints', isLoggedIn, async (req, res) => {
  try {
      const accessories = await config_dao.listAccessoriesWithConstraints();
      res.json(accessories);
  } catch (err) {
      res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/user/config/:userId', isLoggedIn,
  [ check('userId').isInt({ min: 1 }) ],
  async (req, res) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
          return res.status(422).json({ errors: 'Error' });
      }

      const userId = Number(req.params.userId);
      if (req.user.id && req.user.id !== userId) {
          return res.status(422).json({ error: 'URL and body id mismatch' });
      }

      try {
          const result = await config_dao.getConfigurationById(userId);
          if (!result) {
              res.status(404).json({ error: 'Error' });
          } else {
              res.json(result);
          }
      } catch (err) {
          res.status(500).json({ error: 'Error' });
      }
  }
);
// API for saving a new car configuration
app.post('/api/user/config/:userId', isLoggedIn,
  [
      check('userId').isInt({ min: 1 }),
      check('carModelId').isInt({ min: 1 }),
      check('accessories').isArray()
  ],
  async (req, res) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
          return res.status(422).json({ errors: 'Error' });
      }

      const userId = Number(req.params.userId);
      if (req.user.id && req.user.id !== userId) {
          return res.status(422).json({ error: 'URL and body id mismatch' });
      }

      const carConfig = {
          userId: req.user.id,
          carModelId: req.body.carModelId,
          accessories: req.body.accessories,
      };

      try {
          const result = await config_dao.saveNewConfiguration(carConfig);
          if (result.error) {
              res.status(400).json({ error: 'Error' });
          } else {
              res.status(201).json(result);
          }
      } catch (err) {
          res.status(500).json({ error: 'Error' });
      }
  }
);


// API for updating an existing car configuration
app.put('/api/user/config/:userId', isLoggedIn,
  [
      check('userId').isInt({ min: 1 }),
      check('carModelId').isInt({ min: 1 }),
      check('accessories').isArray()
  ],
  async (req, res) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
          return res.status(422).json({ errors: 'Error' });
      }

      const userId = Number(req.params.userId);
      if (req.user.id && req.user.id !== userId) {
          return res.status(422).json({ error: 'URL and body id mismatch' });
      }

      const carConfig = {
          userId: req.user.id,
          carModelId: req.body.carModelId,
          accessories: req.body.accessories,
      };

      try {
          const result = await config_dao.updateExistingConfiguration(carConfig);
          if (result.error) {
              res.status(400).json({ error: 'Error' });
          } else {
              res.status(200).json(result);
          }
      } catch (err) {
          res.status(500).json({ error: 'Error' });
      }
  }
);


// API for deleting a configuration
app.delete('/api/user/config/:userId', isLoggedIn,
  [ check('userId').isInt({ min: 1 })],
  async (req, res) => {
      const errors = validationResult(req).formatWith(errorFormatter);
      if (!errors.isEmpty()) {
          return res.status(422).json({ errors: 'Error' });
      }

      const userId = Number(req.params.userId);
      if (req.user.id && req.user.id !== userId) {
          return res.status(422).json({ error: 'URL and body id mismatch' });
      }

      try {
          const result = await config_dao.deleteConfiguration(userId);
          if (result.error) {
              res.status(400).json({ error: 'Error' });
          } else if (result.message === 'No configuration found for user') {
              res.status(404).json({ error: 'Error' });
          } else {
              res.status(200).json(result);
          }
      } catch (err) {
          res.status(500).json({ error: 'Error' });
      }
  }
);


// login API
app.post('/api/sessions', [
    check('username').isEmail(), check('password').isLength({min:1})
],function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.status(401).json({ error: info });
        }

        //login session
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            return res.json(req.user);
        });
    })(req, res, next);
});

// check if user logged in
app.get('/api/sessions/current', async (req, res) => {
    try{
    const current_info = await user_dao.getUserById(req.user.id);
    if(req.isAuthenticated()) {
        res.status(200).json(current_info);
    } else {
        res.status(401).json({error: 'Error' });
    }
    }
    catch(err){
        res.status(500).json({error: 'Error' });
    }
    
});

// Log out user
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});


// Get the authentication token
app.get('/api/auth-token', isLoggedIn, (req, res) => {
    let userStatus = req.user.isGoodCustomer;

    const payloadToSign = { isGoodCustomer: userStatus, authId: 1234 };
    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {expiresIn: expireTime});

    res.json({ token: jwtToken, isGoodCustomer: userStatus });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
