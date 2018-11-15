const updateCreditTransaction = require("../transactions/updateCredit");
const getCredit = require("./getCredit");
const addToProcessedQueue = require("../controllers/processedQueue");
const log = require("../../logs/winstonConfig");

module.exports = function(message) {
  const query = getCredit();

  query.exec(function(err, credit) {
    if (err) return log.error(`Error in mongo getCredit query: ${err}`);

    current_credit = credit[0].amount;

    if (message.location === undefined) {
      message.location = { name: "Default", cost: 1 };
    }

    if (current_credit > 0) {
      log.info(`Found credit (${credit[0].amount})`);
      updateCreditTransaction(
        {
          amount: { $gte: 1 },
          location: message.location.name
        },
        {
          $inc: { amount: -message.location.cost }
        },
        function(doc, error) {
          if (error) {
            return cb(undefined, error);
          } else if (doc == undefined) {
            let error = "Not enough credit";
            message.staus = "NO CREDIT";
            log.error(`Error in the updateCreditTransaction ${error}`);
            cb(undefined, error);
          }
        }
      ).then(() => {
        message.status = "PAYED";
        addToProcessedQueue(message);
      });
    } else {
      log.info(`Not enough credit found: ${credit}`);
      message.status = "NO CREDIT";
      addToProcessedQueue(message);
    }
  });
};
