# 📘 Finance Data Processing & Access Control Backend

A premium, secure Node.js/Express backend designed for financial dashboard applications. This system prioritizes **Role-Based Access Control (RBAC)**, **Advanced Security**, and **Real-time Data Analytics**.

---

## 🔗 Live Resources

- **Interactive Documentation**: [Swagger UI @ Render](https://finance-data-processing-and-access-doon.onrender.com/api-docs)
- **Deployment Status**: [![Status](https://img.shields.io/website?url=https%3A%2F%2Ffinance-data-processing-and-access-doon.onrender.com%2Fapi-docs)](https://finance-data-processing-and-access-doon.onrender.com/api-docs)

---

## ✨ Key Features

### 🔐 Advanced Security & RBAC
- **Multi-Level Authorization**: 
  - **Admin**: Full system control (Users, Financial Records, Analytics).
  - **Analyst**: Management of records and access to analytics.
  - **Viewer**: Read-only access to dashboard summaries.
- **JWT Protection**: Secured with HttpOnly cookies to mitigate XSS/CSRF risks.
- **Rate Limiting**: Brute-force protection on authentication endpoints.
- **Hardened Middleware**: Integrated with **Helmet**, **CORS**, **HPP**, and **Compression**.

### 📊 Financial Intelligence
- **High-Performance Aggregation**: Real-time calculation of balances, category breakdowns, and totals.
- **Trend Analysis**:
  - **Monthly Trends**: Comparative analytics across years.
  - **Recent Activity**: Filtered insights from the last hour of operations.
- **Dynamic Search**: Regex-powered filtering across categories and descriptions.

### 🛡️ Data Integrity & Auditing
- **Soft Delete System**: Deleted records are archived in a `DeletedRecords` collection for audit purposes.
- **Modification History**: Tracks every field change, capturing who made the edit and the timestamp.

---

## 🛠️ Tech Stack

- **Core**: Node.js & Express.js
- **Database**: MongoDB (Mongoose)
- **Validation**: Joi (Body & Query parameters)
- **Hashing**: Argon2
- **Logging**: Winston & Morgan

---

## 📂 Project Architecture

```text
api/
├── src/
│   ├── config/       # Swagger, Logger, JWT configs
│   ├── controllers/  # Business logic & Aggregation pipelines
│   ├── middleware/   # Auth, Security-Headers, Limiters
│   ├── models/       # Mongoose Schemas (User, Record, Audit)
│   ├── routers/      # API Route definitions
│   ├── utils/        # Constants, Validation, Roles
│   └── app.js        # Express application setup
└── server.js         # Entry point
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB connection string

### 2. Environment Configuration
Create a `.env` file in the root:
```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AdminKey=your_admin_registration_key
AnalystKey=your_analyst_registration_key
```

### 3. Execution
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start for production
npm start
```

---

## 🚦 Core API Reference

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/api/users/register` | `POST` | Public | Register with role-specific keys |
| `/api/users/login` | `POST` | Public | Authenticate and receive session cookie |
| `/api/records/filter` | `GET` | Analyst+ | Advanced search with pagination |
| `/api/dashboard/summary`| `GET` | Viewer+ | Aggregated totals and counts |
| `/api-docs` | `GET` | Public | Interactive Swagger documentation |

---

## 👤 Author

**Subham Banerjee**  
*Project Lead & Architect*
