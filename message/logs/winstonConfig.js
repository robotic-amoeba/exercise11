const { createLogger, format, transports } = require("winston");

let consoleLevel;
if (process.env.env === "development") {
  consoleLevel = "info";
} else {
  consoleLevel = "error";
}

const log = createLogger({
  level: "info",
  format: format.combine(
    format.label({ label: 'Message Service' }),
    format.timestamp(),
    format.prettyPrint()
  ),
  transports: [
    new transports.Console({ consoleLevel }),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "warning.log", level: "warning" })
  ]
});

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf(info => {
    const { timestamp, level, message, ...args } = info;

    const ts = timestamp.slice(0, 19).replace("T", " ");
    return `${ts} [${level}]: ${message} ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
    }`;
  })
);

module.exports = log;
