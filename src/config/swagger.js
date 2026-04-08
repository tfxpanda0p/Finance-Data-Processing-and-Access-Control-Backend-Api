const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance Dashboard API',
            version: '1.0.0',
            description: 'API documentation for the Finance Data Processing and Access Control Backend',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'https://finance-data-processing-and-access-plri.onrender.com',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    apis: [
        path.join(__dirname, '../app.js'),
        path.join(__dirname, '../controllers/*.js'),
        path.join(__dirname, '../routers/*.js'),
        path.join(__dirname, '../models/*.js'),
    ],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
