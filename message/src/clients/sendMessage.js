const saveMessage = require("./saveMessage");
const log = require("../../logs/winstonConfig");

const axios = require("axios");
const messageAPP = axios.create({
  baseURL: "http://messageapp:3000",
  timeout: 2000
});

const options = {
  timeout: 3000, //3s
  errorThresholdPercentage: 50, //50% fails open the circuit
  resetTimeout: 3000 //3s
};
const circuitBreaker = require("opossum");
const circuit = circuitBreaker(requestToMessageAPP, options);

const Queue = require("bull");
const ProcessedRequests = new Queue("ProcessedRequests", "redis://redis:6379");

function requestToMessageAPP(message, job) {
  return messageAPP
    .post("/message", message)
    .then(response => {
      message.status = "OK";
      job.remove();
      return message;
    })
    .catch(error => {
      message.status = "ERROR";
      if (error.response || error.request) {
        if (error.code && error.code === "ECONNABORTED") {
          message.status = "TIMEOUT";
          throw "TIMEOUT";
        }
      }
      throw "ERROR";
    });
}

circuit.on("timeout", a => log.error(`TIMEOUT: timeout in the circuit. App going slow.`));
circuit.on("reject", () => {
  log.warn(`REJECT: The circuit is open. Failing fast.`);
});
circuit.on("close", () => {
  log.warn("CIRCUIT CLOSED");
});
circuit.on("open", () => {
  ProcessedRequests.pause(false).then(log.warn("Processed req queue stopped"));
  log.warn("CIRCUIT OPENED");
});
circuit.on("halfOpen", () => {
  ProcessedRequests.resume(false).then(log.warn("Processed req queue resumed"));
});

ProcessedRequests.resume(false).then(log.warn("Processed req queue resumed"));

module.exports = function(job) {
  const messageReq = job.data;
  const message = {
    destination: messageReq.destination,
    body: messageReq.body
  };
  if (messageReq.status === "PAYED") {
    circuit
      .fire(message, job)
      .then(message => {
        if (message) {
          saveMessage(message);
          log.info(`Success in request to messageapp: ${message}`);
        }
      })
      .catch(e => log.error(`Error inside the circuit: ${e}`));

    circuit.fallback(message => {
      if (message.status) {
        saveMessage(message);
      }
      log.warn("Failed request to messageapp: ", message);
      setTimeout(() => ProcessedRequests.add(job.data), 5000);
    });
  } else {
    saveMessage(messageReq);
  }
};
