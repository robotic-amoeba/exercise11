const saveMessageTransaction = require("../transactions/saveMessage");
const log = require("../../logs/winstonConfig");

module.exports = function(messageParams, cb) {
  log.info(`Saved message:  ${messageParams}`);
  return saveMessageTransaction(messageParams, (undefined, error) => {
    log.error(`Error in in the Save Message Transaction: ${error}`);
  });
};
