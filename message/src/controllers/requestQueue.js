const uuidv1 = require("uuid/v1");
const Queue = require("bull");
const saveMessage = require("../clients/saveMessage");
const log = require("../../logs/winstonConfig");

const requestsQueue = new Queue("MessageRequests", "redis://redis:6379");
const ProcessedRequests = new Queue("ProcessedRequests", "redis://redis:6379");

let processDownTheAppIsHealthy = true;

ProcessedRequests.on("global:paused", () => {
  processDownTheAppIsHealthy = false;
});
ProcessedRequests.on("global:resumed", () => {
  processDownTheAppIsHealthy = true;
});

module.exports = (req, res) => {
  const httpbody = req.body;
  httpbody.requestID = uuidv1();
  saveMessage(
    {
      ...httpbody,
      status: "PENDING"
    },
    function(_result, error) {
      if (error) {
        log(`Error in Save Message Transaction: ${error}`);
      }
    }
  );
  requestsQueue
    .add(httpbody)
    .then(job => {
      log.info("created a job succesfully");
      if (processDownTheAppIsHealthy) {
        res.status(200).send(
          `Request received. Check the status at: http://--/messages/${httpbody.requestID}/status`
        );
      } else {
        res.status(500).send("KO");
      }
    })
    .catch(e => {
      log.error(`Error while trying to add a job to the requests queue: ${e}`);
    });
};
