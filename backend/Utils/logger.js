const winston = require('winston');
const { MongoDB } = require('winston-mongodb');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new MongoDB({
      level: 'error',
      db: process.env.MONGODB_URI,
      collection: 'logs',
      options: { useUnifiedTopology: true }
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'combined.log',
    level: 'debug'
  }));
}

module.exports = logger;