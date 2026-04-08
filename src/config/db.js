const dns = require("dns");
const mongoose = require("mongoose");
const logger = require("./logger");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info(`MongoDB connected: ${conn.connection.port}`);
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message} : ${err.stack}`);
        process.exit(1);
    }
}

module.exports = connectDb;