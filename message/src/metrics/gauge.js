const client = require("prom-client");
const not200gauge = new client.Gauge({ name: "Bad_Req_Count", help: "Counts_the_entries_thoroug_error_middlewere" });
const reqGauge = new client.Gauge({ name: "Requests", help: "Counts_the_number_of_req" });


function not200Counter() {
  not200gauge.inc(1, new Date());
}

function reqCounter() {
  reqGauge.inc(1, new Date());
}

const evaluators = {
  not200Counter,
  reqCounter
}

module.exports = evaluators;
