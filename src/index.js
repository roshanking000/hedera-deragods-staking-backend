const express = require('express');
const app = express();
const https = require("https");
const cors = require('cors');

const api = require("./api");

//db
const db = require('./config/db');

const bodyParser = require('body-parser');
const morgan = require('morgan');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
app.use("/api", api);

// DB connect
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

const httpsPort = 3307;
const privateKey = fs.readFileSync("/etc/letsencrypt/live/stake.deragods.com/privkey.pem");
const certificate = fs.readFileSync("/etc/letsencrypt/live/stake.deragods.com/fullchain.pem");

const credentials = {
  key: privateKey,
  cert: certificate,
}

const server = https.createServer(credentials, app);

server.listen(httpsPort, () => {
  console.log(`[stake.deragods.com] servier is running at port ${httpsPort} as https.`);
});