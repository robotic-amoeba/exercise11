const Queue = require("bull");
const chargeMessage = require("../clients/chargeMessage");
const requestsQueue = new Queue("MessageRequests", "redis://redis:6379");
const log = require("../../logs/winstonConfig");

module.exports = requestsQueue.process(job => {
  log.info(`Job at requests worker: ${job.data}` );
  chargeMessage(job.data);
});
