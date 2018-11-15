const Message = require("../models/message");
const { cleanClone } = require("../utils");
const log = require("../../logs/winstonConfig")

function saveMessageReplica(replica, retries) {
  if (retries > 0) {
    replica.markModified("body");
    return replica
      .save()
      .then(doc => {
        log.info(`Message replicated successfully: ${doc}`);
        return doc;
      })
      .catch(err => {
        log.error(`Error while saving message replica: ${err}`);
        return saveMessageReplica(replica, retries - 1);
      });
  }
}

function saveMessageTransaction(newValue) {
  const MessagePrimary = Message();
  const MessageReplica = Message("replica");

  let message = new MessagePrimary(newValue);
  log.info(`Message at transaction: ${message}`);
  return message
    .save()
    .then(doc => {
      log.info(`Message saved successfully: ${doc}`);
      return cleanClone(doc);
    })
    .then(clone => {
      let replica = new MessageReplica(clone);
      saveMessageReplica(replica, 3);
      return clone;
    })
    .catch(err => {
      log.error(`Error while saving message in main DB: ${err}`);
      throw err;
    });
}

module.exports = function(messageParams, cb) {
  saveMessageTransaction(messageParams)
    .then()
    .catch(err => {
      cb(undefined, err);
    });
};
