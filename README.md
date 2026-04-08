# 📘 Finance Data Processing & Access Control Backend API

A premium, secure Node.js/Express backend designed for financial dashboard applications. This system prioritizes **Role-Based Access Control (RBAC)**, **Advanced Security**, and **Real-time Data Analytics**.

---

## 🔗 Live Resources

- **Interactive Documentation**: [Swagger UI @ Render](https://finance-data-processing-and-access-plri.onrender.com/api-docs)
- **Deployment Status**: [![Status](https://img.shields.io/website?url=https%3A%2F%2Ffinance-data-processing-and-access-plri.onrender.com%2Fapi-docs)](https://finance-data-processing-and-access-plri.onrender.com/api-docs)

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
ADMIN_PASS=your_admin_registration_key
ANALYST_PASS=your_analyst_registration_key
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

| Category | Endpoint | Method | Access | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/api/users/register` | `POST` | Public | Register with role keys |
| | `/api/users/login` | `POST` | Public | Authenticate & get session |
| | `/api/users/logout` | `POST` | Auth | Terminate session |
| | `/api/users/me` | `GET` | Auth | Get current user profile |
| **Admin** | `/api/users/all` | `GET` | Admin | List all registered users |
| | `/api/users/:id` | `GET` | Admin | Get user details by ID |
| | `/api/users/status/:id` | `PUT` | Admin | Toggle active/inactive |
| | `/api/users/role/:id` | `PUT` | Admin | Change user authorization |
| | `/api/users/:id` | `DELETE` | Admin | Permanently remove user |
| **Records** | `/api/records/create` | `POST` | Admin | Add a new financial entry |
| | `/api/records/update/:id` | `PUT` | Admin | Modify existing record |
| | `/api/records/delete/:id` | `DELETE` | Admin | Archive record to audit collection |
| | `/api/records/all` | `GET` | Admin | View all system records |
| | `/api/records/filter` | `GET` | Admin/Analyst | Advanced search & paging |
| | `/api/records/export` | `GET` | Admin/Analyst | Generate CSV data export |
| | `/api/records/:id` | `GET` | Admin/Analyst | Specific record lookup |
| **Dash** | `/api/dashboard/summary` | `GET` | All | Totals, counts & net balance |
| | `/api/dashboard/categories`| `GET` | All | Category-wise spending breakdown |
| | `/api/dashboard/recent/hour` | `GET` | All | Activity from the last 60 mins |
| | `/api/dashboard/recent/day` | `GET` | All | Summary for the last 24 hours |
| | `/api/dashboard/trends/weekly` | `GET` | All | 7-day rolling trends |
| | `/api/dashboard/trends/monthly`| `GET` | All | Year-over-year monthly comps |
| | `/api/dashboard/records` | `GET` | All | Rich records with audit info |
| **Docs** | `/api-docs` | `GET` | Public | Interactive Swagger UI |

**Default Root Landing**: Visiting `/` will automatically redirect you to `/api-docs`.

---

## 👤 Author

**Subham Banerjee**  
*Project Lead & Architect*
