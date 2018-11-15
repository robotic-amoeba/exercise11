const Queue = require("bull");
const options = { defaultJobOptions: { removeOnComplete: false } };
const ProcessedRequests = new Queue("ProcessedRequests", "redis://redis:6379", options);
const log = require("../../logs/winstonConfig");

module.exports = message => {
  ProcessedRequests.count().then(messagesEnqueued => {
    if (messagesEnqueued < 10) {
      log.info(`Messages in the processed queue: ${messagesEnqueued}`);
      ProcessedRequests.add(message, { removeOnComplete: false })
        .then(job => {
          log.info(`Job at processed queue: ${job.data}`);
        })
        .catch(e => {
          log.error(`Error adding job to processed queue: ${e}`);
        });
    } else {
      log.warn(`BLOCKIN REQUESTS IN PROCESSED QUEUE: OVERFLOW (${messagesEnqueued})`);
      return;
    }
  });
};
