// Dependencies
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const admin = require("firebase-admin");
const { exec } = require("child_process");

// Turn off console log in production mode
if (process.env.NODE_ENV === "production") {
  console.log = function () {};
}

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

// Serve static files
app.use(express.static("public"));

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes

// Generate required server side certificates and OpenVPN server config
// Accepted body is { "cn": "org common name", "id": "unique server id" }
// This runs the server config script directly because the API
// and OpenVPN sever are on the same virtual machine currently
app.post("/server-config", (req, res) => {
  if (
    !req.is("application/json") ||
    !req.body ||
    !req.body.cn ||
    !req.body.id
  ) {
    res
      .status(400)
      .send(
        'Bad Request: expected request body is { "cn": "org common name", "serverId": "unique server id" }'
      );
    return;
  }

  exec(
    `bash public/scripts/server_config.sh ${req.body.cn} ${req.body.id}`,
    (error, stdout, stderr) => {
      if (error) {
        res.sendStatus(500);
        console.error(`Failed to run server_config.sh: ${error.message}`);
      } else {
        res.sendStatus(201);
        console.error(`server_config.sh stderr:\n${stderr}`);
        console.log(`server_config.sh stdout:\n${stdout}`);
      }
    }
  );
});

// Post HMAC key (ta.key) for an organization
// Accepted body is a .key file
// Need secure transfer in the future
app.post("/ta/:cn", express.text("key"), (req, res) => {
  if (!req.is("text/plain") || !req.body) {
    res.status(400).send("Bad Request: expected request body is .key file");
    return;
  }

  // Save the key file
  const { cn } = req.params;
  const keyPath = `${process.env.EASYRSA_PKI}/${cn}/private/ta.key`;
  fs.writeFile(keyPath, req.body, (err) => {
    if (err) {
      res.sendStatus(500);
      console.error(`HMAC key: read error: ${err.message}`);
    } else {
      res.sendStatus(201);
    }
  });
});

// Get HMAC key (ta.key) for an organization
// Need secure transfer in the future
app.get("/ta/:cn", (req, res) => {
  const { cn } = req.params;
  const keyPath = `${process.env.EASYRSA_PKI}/${cn}/private/ta.key`;

  fs.access(keyPath, (err) => {
    // Send key if exists
    if (!err) {
      res.download(keyPath, "ta.key", (err) => {
        if (err) {
          res.sendStatus(500);
          console.error(`HMAC key send error: ${err.message}`);
        }
      });
    } else {
      res.status(404).send(`No HMAC key for ${cn}`);
    }
  });
});

// Generate CA for an organization
// :cn is common name for the organization
// Does not require request body or return CA in response
app.post("/ca/:cn", (req, res) => {
  // TODO: Add logic for auth and database
  const { cn } = req.params;
  const caPath = `${process.env.EASYRSA_PKI}/${cn}/ca.crt`;

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

// Get CA for an organization
// :cn is common name for the organization
app.get("/ca/:cn", (req, res) => {
  // TODO: Add logic for auth and database
  const { cn } = req.params;
  const caPath = `${process.env.EASYRSA_PKI}/${cn}/ca.crt`;

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
// :cn is common name for the organization
// :type is either "server" or "client"
// :id is a unique id for the certificate
// Request body: .req file for certificate sign request
app.post("/cert/:cn/:type/:id", express.text("req"), (req, res) => {
  // TODO: Add logic for auth and database
  if (!req.is("text/plain") || !req.body) {
    res.status(400).send("Bad Request: expected request body is .req file");
    return;
  }

  const { cn, type, id } = req.params;
  if (type !== "server" && type !== "client") {
    res
      .status(400)
      .send("Bad Request: 'type' should be either 'server' or 'client'");
    return;
  }

  const data = req.body;
  const certName = type + id;
  const reqPath = `/tmp/${certName}.req`;

  // Save cert req as file and sign it
  fs.writeFile(reqPath, data, (err) => {
    if (err) {
      res.sendStatus(500);
      console.error(`Cert req: read error: ${err.message}`);
      return;
    }

    exec(
      `sh scripts/sign_cert.sh ${cn} ${type} ${reqPath} ${certName}`,
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
// :cn is common name for the server's/client's organization
// :type is either "server" or "client"
// :id is certificate id
app.get("/cert/:cn/:type/:id", (req, res) => {
  // TODO: Add logic for auth and database
  const { cn, type, id } = req.params;
  if (type !== "server" && type !== "client") {
    res
      .status(400)
      .send("Bad Request: 'type' should be either 'server' or 'client'");
    return;
  }

  const certName = type + id;
  const certPath = `${process.env.EASYRSA_PKI}/${cn}/issued/${certName}.crt`;

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
  if (
    !req.is("application/json") ||
    !req.body.email ||
    !req.body.password ||
    !req.body.displayName
  ) {
    res
      .status(400)
      .send(
        "Bad Request: expected request body is { 'email': 'my@example.com', 'password': 'xxx', 'displayName': 'First Last' }"
      );
    return;
  }
  const { email, password, displayName } = req.body;

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
