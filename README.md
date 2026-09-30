# Job Application Tracking System

A full-stack web application designed to streamline the job application and recruitment lifecycle for Applicants and Companies/Recruiters.

## Tech Stack

- **Frontend**: React.js (Vite), React Router DOM, Tailwind CSS, Axios, Lucide React
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Multer
- **Database**: MongoDB, Mongoose

---

## Project Structure

```
job-application-tracker/
│
├── frontend/                     # React + Vite client
│   ├── src/
│   │   ├── assets/               # Static assets & icons
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth & Notification contexts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # Layout wrappers
│   │   ├── pages/                # Route views (Applicant & Recruiter)
│   │   ├── routes/               # Route definitions & guards
│   │   ├── services/             # Axios API service callers
│   │   ├── utils/                # Helper utilities & formatters
│   │   └── App.jsx               # Application root component
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                      # Node.js + Express REST API
│   ├── config/                   # DB and Multer configs
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Auth, RBAC, error handlers
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # Express route endpoints
│   ├── services/                 # Notification & business logic
│   ├── utils/                    # Token generation, helpers
│   ├── validators/               # Input validation rules
│   ├── uploads/                  # Uploaded resume files
│   ├── server.js                 # Express server entry point
│   └── package.json
│
├── .env.example                  # Environment configuration template
├── .gitignore
└── README.md
```

---

## Quick Start (Running Independently)

### 1. Backend

```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs on `http://localhost:5173` by default.

---

## Actors & Roles

1. **Applicant**: Search jobs, view details, upload resume to apply, track application status, receive status notifications.
2. **Company / Recruiter**: Post and manage jobs, review candidate applications, download resumes, evaluate candidates, update status (Shortlist / Reject / Hire).
