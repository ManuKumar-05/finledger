// src/config/swagger.js

const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinLedger API',
      version: '1.0.0',
      description: `
## FinLedger — Finance Dashboard REST API

A role-based finance management system supporting full CRUD on financial records,
user management, and dashboard analytics.

### Roles & Permissions
| Role     | Records | Analytics | User Mgmt |
|----------|---------|-----------|-----------|
| Admin    | Full    | ✓         | ✓         |
| Analyst  | Read    | ✓         | ✗         |
| Viewer   | Read    | ✗         | ✗         |

### Authentication
All protected endpoints require a Bearer token obtained from \`POST /api/auth/login\`.
      `,
      contact: { name: 'FinLedger', email: 'dev@finledger.io' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local development' },
      { url: 'https://finledger-api.onrender.com', description: 'Production (Render)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:         { type: 'integer', example: 1 },
            name:       { type: 'string',  example: 'Alice Chen' },
            username:   { type: 'string',  example: 'admin' },
            email:      { type: 'string',  example: 'alice@finledger.io' },
            role:       { type: 'string',  enum: ['admin','analyst','viewer'] },
            status:     { type: 'string',  enum: ['active','inactive'] },
            created_at: { type: 'string',  format: 'date-time' },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            description: { type: 'string',  example: 'Monthly Salary' },
            amount:      { type: 'number',  example: 85000 },
            type:        { type: 'string',  enum: ['income','expense'] },
            category:    { type: 'string',  example: 'salary' },
            date:        { type: 'string',  format: 'date', example: '2025-04-01' },
            notes:       { type: 'string',  example: 'April salary' },
            created_by:  { type: 'integer', example: 1 },
            created_at:  { type: 'string',  format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Something went wrong' },
            errors:  { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJSDoc(options);
