// Dependencies
const express = require('express');
const path = require('path');

// Sets up the Express App
const app = express();
const PORT = 3000;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const users = [
    {
      id: 1,
      userName: 'yoda',
      password: 'YODA900',
      email: 'yoda@gmail.com',
      org: 'Star Wars'
    },
    {
      id: 2,
      userName: 'darthmaul',
      password: 'DarthMaul200',
      email: 'darthmaul@gmail.com',
      org: 'Star Wars'
    },
    {
      id: 3,
      userName: 'obiwankenobi',
      password: 'ObiWanKenobi55',
      email: 'obiwankenobi@gmail.com',
      org: 'Star Wars'
    },
  ];
  
  // Routes

// Basic route that sends the user first to the AJAX Page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'view.html')));

// Get a collection of users
app.get('/api/users', (req, res) => res.json(users));

// Get a user by userId
app.get('/api/users/:userId', (req, res) => {
  const chosen = req.params.userId;

  // console.log(chosen);

  /* Check each character routeName and see if the same as "chosen"
  If the statement is true, send the character back as JSON,
  otherwise tell the user no character was found */

  for (let i = 0; i < users.length; i++) {
      if (chosen == users[i].id) {
        return res.json(users[i]);
      }
  }

  return res.json(false);
});

// Create a new user
app.post('/api/users', (req, res) => {
  let duplicateUserName = false;
  const newUser = req.body;
  for (let i = 0; i < users.length; i++) {
    if (users[i].userName == newUser.userName) {
      duplicateUserName = true;
    }
  }
  if (duplicateUserName) {
    return res.json(false);
  } else {
    users.push(newUser);
    return res.json(newUser);
  }
});

// Update a user's info
app.put('/api/users', (req, res) => {
  const updatedUser = req.body;
  for (let i = 0; i < users.length; i++) {
    if (users[i].id == updatedUser.id && users[i].userName === updatedUser.userName) {
      users[i].password = updatedUser.password;
      users[i].email = updatedUser.email;
      users[i].org = updatedUser.org;
      return res.json(updatedUser);
    }
  }
  return res.json(false);
});

// Delete a user
app.delete('/api/users', (req, res) => {
  const deletedUser = req.body;
  for (let i = 0; i < users.length; i++) {
    if (users[i].id == deletedUser.id && users[i].userName === deletedUser.userName) {
      delete users[i];
      return res.json(deletedUser);
    }
  }
  return res.json(false);
});


// Starts the server to begin listening
app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));