const express = require("express");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const logger = require("./config/logger");

const app = express();

// Middleware
app.use(cors()); //use cors to allow cross-origin requests
app.use(compression()); //use compression to compress response
app.use(helmet()); //use helmet to set security headers
app.use(cookieParser()); //use cookie-parser to parse cookies
app.use(express.json()); //use express.json to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //use express.urlencoded to parse URL-encoded bodies
app.use(hpp()); // Prevent parameter pollution

// Rate limiting (skip in tests for convenience)
if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    });
    app.use(limiter);
}

// Routes
const userRoutes = require("./routers/userRoutes");
const recordRoutes = require("./routers/recordRoutes");
const dashboardRoutes = require("./routers/dashboardRoutes");

app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Redirect root to Swagger Documentation
app.get("/", (req, res) => {
    res.redirect("/api-docs");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
