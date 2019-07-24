try {
  Object.assign(process.env, require('./env'))
}
catch(ex) {
  console.log(ex)
}

const axios = require('axios');
const qs = require('querystring');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const express = require('express');
const app = express();

app.use(session({
  secret: process.env.SessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.engine('html', ejs.renderFile);

app.get('/', (req,res,next) => {
  res.render(path.join(__dirname, './index.html'),{user: req.session.user})
});
app.get('/github/callback/', (req,res,next) => {
  console.log(req.query.code)
  axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.clientId,
    client_secret: process.env.clientSecret,
    code: req.query.code
  })
  .then(response => response.data)
  .then(data => {
    const { access_token } = qs.parse(data)
    console.log('access token: '+access_token)
    return axios.get('https://api.github.com/user', {
      headers: {
        authorization: `token ${access_token}`
      }
    })
  })
  .then(response => response.data)
  .then(githubUser => {
    console.log(githubUser)
    req.session.user = githubUser;
    console.log(req.session)
    res.redirect('/');
  })
  .catch(next);
});
app.get('/login', (req,res,next) => {
  const URL = `https://github.com/login/oauth/authorize?client_id=${process.env.clientId}`;
  res.redirect(URL)
});


const PORT = process.env.PORT || '3000'
console.log(`App listening on port: ${PORT}`)
app.listen(PORT)
