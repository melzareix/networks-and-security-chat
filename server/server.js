const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const ExpressPeerServer = require('peer').ExpressPeerServer;
const bcrypt = require('bcryptjs');

const clients = [];
const all_clients = {};

const server = app.listen(9000);

const options = {
  debug: true
}

const peerserver = ExpressPeerServer(server, options);

peerserver.on('connection', (client) => {
  console.log(`${client} connected.`);
  clients.push(client);
});


peerserver.on('disconnect', (client) => {
  console.log(`${client} disconnected.`);
  clients.splice(clients.indexOf(client));
});


app.use(cors());
app.use(bodyParser.json());
app.use('/api', peerserver);

app.post('/signup', (req, res, next) => {
  const { username, password } = req.body;
  let uRegex = new RegExp('^[a-zA-Z0-9_]*$');

  if (!uRegex.test(username)) {
    throw new Error('invalid username must be alphanumeric-only.');
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  if (all_clients[username] === undefined) {
    all_clients[username] = hash;
  } else {
    throw new Error('user exists.');
  }
  return res.send({
    response: 'signup success.'
  });
});


app.post('/login', (req, res, next) => {
  console.log(req.body);
  const { username, password } = req.body;
  const hash = all_clients[username];
  const cmp = bcrypt.compareSync(password, hash);
  console.log(hash, cmp);
  if (!cmp) {
    throw new Error('invalid user.');
  }
  return res.send({
    response: 'login success.'
  });
});

app.get('/peers', (req, res) => {
  res.send({
    clients
  });
});

app.use((err, req, res, next) => {
  return res.status(400).send({
    response: err.message
  });
})
