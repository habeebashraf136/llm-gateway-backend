import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

winston.addColors({
  info:  "cyan",
  warn:  "yellow",
  error: "red",
  debug: "magenta"
});


const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);


const fileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: "info",

  transports: [
    new winston.transports.Console({
      format: consoleFormat
    }),


    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat
    }),


    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat
    })
  ]
});

export default logger;