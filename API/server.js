// Dependencies
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");
const { exec } = require("child_process");

// Config easy-rsa
exec("sh scripts/easyrsa_vars.sh", (error, stdout, stderr) => {
  if (error) {
    console.error(`easyrsa_vars error: ${error.message}`);
  }
  if (stderr) {
    console.error(`easyrsa_vars stderr:\n${stderr}`);
  }
});

// Set up Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
// const db = admin.firestore();

// Sets up the Express App
const app = express();
const PORT = process.env.PORT;

// Secure app
app.use(helmet());

// Allow CORS from front end
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes

// Basic route that sends the user first to the AJAX Page
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "view.html")));

// app.get("/test", (req, res) => {
//   exec("ls /etc/pki/vswitch", (error, stdout, stderr) => {
//     if (error) {
//       res.sendStatus(500);
//       console.error(`test error: ${error.message}`);
//       return;
//     }
//
//     if (stderr) {
//       res.sendStatus(500);
//       console.error(`test stderr:\n${stderr}`);
//       return;
//     }
//
//     res.sendStatus(200);
//     console.log(`test stdout:\n${stdout}`);
//   });
// });

app.get("/ca", (req, res) => {
  // TODO: Add logic for user auth and database
  exec("sh scripts/gen_ca.sh vswitch", (error, stdout, stderr) => {
    if (error) {
      res.sendStatus(500);
      console.error(`ca error: ${error.message}`);
      return;
    }
    res.sendStatus(200);
    // build-ca command outputs to stderr
    console.error(`ca stderr:\n${stderr}`);
    console.log(`ca stdout:\n${stdout}`);
  });
});

// Create a new user
app.post("/users", (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    res.sendStatus(400);
  }

  admin
    .auth()
    .createUser({
      email,
      password,
      displayName,
    })
    .then(() => res.sendStatus(200))
    .catch((error) => {
      console.log("Error creating new user:", error);
      res.status(500).send(error.errorInfo.message);
    });
});

// Start the server
app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));
