// Dependencies
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
const { exec } = require("child_process");

// Turn off console log in production mode
if (process.env.NODE_ENV === "production") {
  console.log = function () {};
}

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

// Generate CA
// POST body: { cn: "common-name" }
// Does not return CA in response
app.post("/ca", (req, res) => {
  // TODO: Add logic for auth and database
  const { cn } = req.body;
  const caPath = `/etc/pki/${cn}/ca.crt`;

  fs.access(caPath, (err) => {
    // Do not generate CA if exists
    if (!err) {
      res.status(409).send(`CA for ${cn} already exists`);
      return;
    }

    // Generate CA if not exists
    exec(`sh scripts/gen_ca.sh ${cn}`, (error, stdout, stderr) => {
      if (error) {
        res.sendStatus(500);
        console.error(`CA build exec error: ${error.message}`);
        return;
      }
      res.sendStatus(201);

      // build-ca command outputs to stderr
      console.error(`CA build stderr:\n${stderr}`);
      console.log(`CA build stdout:\n${stdout}`);
    });
  });
});

// Get CA
app.get("/ca", (req, res) => {
  // TODO: Add logic for auth and database
  const cn = "vswitch";
  const caPath = `/etc/pki/${cn}/ca.crt`;

  fs.access(caPath, (err) => {
    // Send CA if exists
    if (!err) {
      res.download(caPath, "ca.crt", (err) => {
        if (err) {
          res.sendStatus(500);
          console.error(`CA send error: ${err.message}`);
        }
      });
    } else {
      res.status(404).send(`No CA for ${cn}`);
    }
  });
});

// Sign the certificate request from a server/client
// POST body: { data: "base64 encoded string of the certificate request" }
app.post("/cert-req", (req, res) => {
  // TODO: Add logic for auth and database
  const cn = "vswitch";
  const type = "server";
  const name = "server0";

  const { data } = req.body;
  if (!data) {
    res.status(400).send("Missing certificate request data");
    return;
  }

  // Save cert req as file and sign it
  const reqPath = `/tmp/${name}.req`;
  fs.writeFile(reqPath, data, (err) => {
    if (err) {
      res.sendStatus(500);
      console.error(`Cert req: read error: ${err.message}`);
      return;
    }

    exec(
      `sh scripts/sign_cert.sh ${cn} ${type} ${reqPath} ${name}`,
      (error, stdout, stderr) => {
        if (error) {
          res.sendStatus(500);
          console.error(`Cert req: sign error: ${error.message}`);
          return;
        }
        res.sendStatus(201);

        // sign-req command outputs to stderr
        console.error(`Cert req: sign stderr:\n${stderr}`);
        console.log(`Cert req: sign stdout:\n${stdout}`);
      }
    );
  });
});

// Get the signed certificate for a server/client
app.get("/cert", (req, res) => {
  // TODO: Add logic for auth and database
  const cn = "vswitch";
  const type = "server";
  const certName = "server0";
  const certPath = `/etc/pki/${cn}/issued/${certName}.crt`;

  // Send cert if exists
  fs.access(certPath, (err) => {
    if (err) {
      res.status(404).send("No cert");
      return;
    }
    res.download(certPath, `${type}.crt`, (err) => {
      if (err) {
        res.sendStatus(500);
        console.error(`Cert send error: ${err.message}`);
      }
    });
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
    .then(() => res.sendStatus(201))
    .catch((error) => {
      console.log("Error creating new user:", error);
      res.status(500).send(error.errorInfo.message);
    });
});

// Start the server
app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));
