# No Tre(ou)ble - Breath Management & Vocal Training Portal

A comprehensive, full-stack web application for vocal pedagogy and breath management training ("ResoNova"). It provides structured 5-stage learning progression, interactive posture & breathing exercises, real-time vocal recording & pitch analysis, practice journals, and a complete administration and curriculum CMS suite.

---

## 🎵 Features

- **5-Stage Pedagogical Progression**:
  1. *Gain Attention & Objectives*: Interactive flashcard learning goals.
  2. *Stimulate Recall & Present Content*: Video & media guide lectures with responsive controls.
  3. *Guided Practice & Feedback*: Dual-level interactive breathing & posture mechanics with 3D/canvas models.
  4. *Assess Performance*: Song performance recording, pitch detection, and real-time rubric evaluation.
  5. *Enhance Retention & Transfer*: Reflective practice journaling and progress analytics.
- **Interactive Posture & Breath Therapy**: Visual anatomy animations, guided timers, and breathing synchronization.
- **Vocal Recording Studio**: In-browser audio capture with automated file management and evaluation scoring.
- **Comprehensive Admin Suite**:
  - Full Curriculum & Module Management (CMS).
  - User and Student Management with Role-Based Access Control (RBAC).
  - Practice Analytics & Audit Logs.
  - Welcome / Hero Page CMS with asset previews.
- **Enterprise-Ready Infrastructure**:
  - Containerized with Docker and Docker Compose.
  - Kubernetes manifests for scaling, ingress, and persistent storage.
  - Nginx reverse proxy with SSL termination support.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Three.js / Canvas.
- **Backend**: Node.js, Express, MySQL2, Redis, JSON Web Tokens (JWT), Multer.
- **Database**: MySQL 8.0+.
- **DevOps**: Docker, Docker Compose, Kubernetes, Nginx.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://www.mysql.com/) (v8.0 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### 1. Database Setup

1. Start your local MySQL service.
2. Initialize the database schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   *(Optional)* Apply backup seed data from `backend/backups/` if required.

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your MySQL credentials and JWT secret.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the backend development server:
   ```bash
   node server.js
   ```
   Backend will run at `http://localhost:5000`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`.

---

## 🐳 Docker Deployment

To spin up the entire application stack (Frontend, Backend, MySQL, Redis, and Nginx) using Docker Compose:

```bash
docker-compose up --build -d
```

For development mode:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## ☸️ Kubernetes Deployment

Deploy all resources onto your cluster:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mysql-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## 📄 License

This project is licensed under the ISC License.
