const winston = require("winston");
const path = require("path");

const baseTimestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

const logFormat = winston.format.combine(
    baseTimestamp,
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}] : ${message} ${stack || ''}`;
    })
);


const errorFileFormat = winston.format.combine(
    baseTimestamp,
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return stack
            ? `${timestamp} [${level.toUpperCase()}] : ${message}\n${stack}`
            : `${timestamp} [${level.toUpperCase()}] : ${message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            format: errorFileFormat
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),

        }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            logFormat
        ),
    }));
}

module.exports = logger;