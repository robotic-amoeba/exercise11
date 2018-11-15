const debug = require("debug")("debug:payedRequestsWorker");
const Queue = require("bull");
const ProcessedRequests = new Queue("ProcessedRequests", "redis://redis:6379");
const sendMessage = require("../clients/sendMessage");
const log = require("../../logs/winstonConfig");

module.exports = ProcessedRequests.process(job => {
  log.info("Payed request received: ", job.data);
  sendMessage(job);
});
