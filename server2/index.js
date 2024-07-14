'use strict';

const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');

const { body, validationResult } = require("express-validator");

const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = '7b4e36d8f4b41d3f2bff77bfeebceba87d485d1490d77bc1fc4c1370a622a6a7';

const jsonwebtoken = require('jsonwebtoken');
const expireTime = 60; //seconds
const token = jsonwebtoken.sign( { goodCustomer: 1, authId: 1234 }, jwtSecret, {expiresIn: expireTime});


// init express
const app = express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json()); 

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);


// To return a better object in case of errors
app.use( function (err, req, res, next) {
  //console.log("DEBUG: error handling function executed");
  console.log(err);
  if (err.name === 'UnauthorizedError') {
    // Example of err content:  {"code":"invalid_token","status":401,"name":"UnauthorizedError","inner":{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2024-05-23T19:23:58.000Z"}}
    res.status(401).json({ errors: [{  'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  } else {
    next();
  }
} );



app.post('/api/estimation',
   body('accessories').isArray(),  
   (req, res) => {
    // Check if validation is ok
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({errors: errList});
    }
  //console.log("DEBUG: auth: ",req.auth);
  const isGoodCustomer = req.auth.isGoodCustomer;
  const accessories = req.body.accessories;
  const nChars = Array.from(accessories).filter(char => char !== ' ').length;
  let estimation = (nChars*3) + Math.floor(Math.random()*90)+1;
  if (isGoodCustomer === 1){
    estimation = Math.round(estimation / (Math.floor(Math.random() * 3) + 2));
    res.json({days: estimation});
  }
  else{
    res.json({days: estimation});
  }
});


// Activate the server
app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});