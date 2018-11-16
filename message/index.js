const express = require("express");
const log = require("./logs/winstonConfig");

const bodyParser = require("body-parser");
const { Validator, ValidationError } = require("express-json-validator-middleware");

const requestQueue = require("./src/controllers/requestQueue");
const getMessages = require("./src/controllers/getMessages");
const getStatus = require("./src/controllers/getStatus");

const app = express();

const evaluators = require("./src/metrics/gauge");

const client = require("prom-client");

client.collectDefaultMetrics({ timeout: 1000 });

const validator = new Validator({ allErrors: true });
const { validate } = validator;

const messageSchema = {
  type: "object",
  required: ["destination", "body"],
  properties: {
    destination: {
      type: "string"
    },
    body: {
      type: "string"
    },
    location: {
      name: {
        type: "string"
      },
      cost: {
        type: "number"
      }
    }
  }
};

const payedReqWorker = require("./src/controllers/payedReqWorker");

app.use((req, res, next)=>{
  evaluators.reqCounter();
  next();
})

app.post("/messages", bodyParser.json(), validate({ body: messageSchema }), requestQueue);

app.get("/messages", getMessages);

app.get("/messages/:requestID/status", getStatus);

app.get("/metrics", (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(client.register.metrics());
});

app.use(function(err, req, res, next) {
  log.info(`Error captured in middlewere: ${err}`);
  evaluators.not200Counter();
  if (err instanceof ValidationError) {
    res.sendStatus(400);
  } else {
    res.sendStatus(500);
  }
});

const port = 9011;
app.listen(port, function() {
  log.info(`App started on PORT ${port}`);
});
