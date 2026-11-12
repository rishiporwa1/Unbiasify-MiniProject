# Unbiasify — AI-Powered Sentiment & Bias Detection Platform

Unbiasify is a full-stack web application designed to analyze text, detect sentiment polarity, and identify potential linguistic bias. The platform features an interactive, glassmorphic React frontend paired with a Django REST Framework backend powered by Natural Language Processing (NLP) heuristics and JWT-based authentication.

---

## Architecture Overview

```
Unbiasify/
├── backend/                  # Django REST Framework API
│   ├── analyzer/             # Core application (models, views, NLP processing, URLs)
│   │   ├── models.py         # TextAnalysis & PasswordResetToken models
│   │   ├── utils.py          # TextBlob NLP sentiment & polarity evaluation
│   │   ├── views.py          # Authentication, Profile, Analysis, & History APIs
│   │   └── urls.py           # Endpoint route mappings
│   ├── server/               # Project configuration (settings, WSGI, root URLs)
│   ├── manage.py             # Django management CLI
│   └── requirements.txt      # Python dependencies (Django, DRF, SimpleJWT, TextBlob)
├── frontend/                 # React (Vite) + Tailwind CSS client
│   ├── src/
│   │   ├── Components/       # UI & WebGL shader components (LiquidEther, etc.)
│   │   ├── App.jsx           # Main application logic, auth state, and view routing
│   │   ├── main.jsx          # React DOM entrypoint
│   │   └── index.css         # Tailwind base styles and theme tokens
│   ├── package.json          # Node dependencies (React 19, Axios, Three.js, Lucide)
│   └── vite.config.js        # Vite bundler configuration
└── Unbiasify - Sample Test Texts.txt  # Benchmark and testing prompts
```

---

## Core Features & Functionalities

### 1. NLP Sentiment & Polarity Engine
* **Polarity Scoring:** Computes sentiment polarity ranging from `-1.0` (strongly negative) to `+1.0` (strongly positive) using `TextBlob`.
* **Classification:** Categorizes text into discrete buckets:
  * **Positive:** Polarity $> 0.0$ (accented in green)
  * **Negative:** Polarity $< 0.0$ (accented in red)
  * **Neutral:** Polarity $= 0.0$ (accented in yellow)
* **Visual Metric Representation:** Includes a normalized dual-directional progress bar visualizing sentiment intensity and direction across the `[-1, +1]` spectrum.
* **Input Validation:** Enforces character boundaries (up to 5,000 characters) with real-time character counters and reset controls.

### 2. User Authentication & Authorization
* **JWT Authentication:** Powered by `djangorestframework-simplejwt` with 24-hour access tokens and 7-day refresh tokens.
* **Dual-Identifier Login:** Supports signing in using either registered `username` or `email`.
* **Password Security:** Enforces length constraints ($\ge 8$ characters) and runs standard Django password validators.
* **Visibility Toggles:** Custom eye toggle controls on all password fields for UX clarity.

### 3. Password Reset Workflow
* **Cryptographic Token Issuance:** Generates secure, URL-safe random tokens (`secrets.token_urlsafe(32)`).
* **Time-to-Live (TTL) Enforcement:** Tokens expire automatically after 15 minutes.
* **SMTP Integration:** Dispatches reset tokens to registered email addresses via standard SMTP backends.
* **Token Invalidation:** Previous user tokens are revoked upon issuing a new request or successful password change.

### 4. User Profile & Historical Analytics
* **Aggregate Metrics Dashboard:** Displays real-time breakdown of user activity:
  * Total analyses conducted
  * Count of Positive submissions
  * Count of Negative submissions
  * Count of Neutral submissions
* **Analysis Audit Log:** Retrieves the 20 most recent text analyses performed by the user, including timestamped records, truncated text previews, classified labels, and precise polarity values.

### 5. Account Management
* **Profile Modification:** Allows authenticated updates to username and contact email with unique constraint validation.
* **Credential Rotation:** Authenticated password update endpoint with current password verification.
* **Account Deletion:** Permanent, cascade deletion of user accounts and associated analysis history with re-authentication confirmation.

### 6. Interactive Visual Design
* **Glassmorphic UI:** Modern glass card styling with backdrop blur filters and translucent borders.
* **WebGL Fluid Simulation:** Ambient background rendering powered by Three.js shaders via `LiquidEther`.
* **Client-Side View Router:** Frictionless single-page app (SPA) screen transitions (`home`, `login`, `register`, `forgot`, `profile`).

---

## API Specification

All backend endpoints are prefixed with `/api/`:

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/register/` | No | Creates a new user account; returns access/refresh JWT tokens. |
| `POST` | `/api/login/` | No | Authenticates user credentials (username/email + password); returns JWT tokens. |
| `POST` | `/api/forgot-password/` | No | Generates and emails a 15-minute password reset token. |
| `POST` | `/api/reset-password/` | No | Validates token and updates user password. |
| `POST` | `/api/change-password/` | Yes | Updates password for currently logged-in user. |
| `PATCH`| `/api/profile/edit/` | Yes | Updates current user's username or email address. |
| `POST` | `/api/delete-account/` | Yes | Validates password and permanently deletes user account. |
| `POST` | `/api/analyze/` | Yes | Executes sentiment evaluation on submitted text (max 5000 chars) and logs record. |
| `GET`  | `/api/history/` | Yes | Fetches top 20 recent text analyses for the requesting user. |
| `GET`  | `/api/profile/` | Yes | Returns user profile details and cumulative sentiment summary statistics. |

---

## Setup & Installation Guide

### Prerequisites
* **Python:** 3.10+
* **Node.js:** 18.0+
* **Package Managers:** `pip` and `npm`

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download TextBlob NLTK corpora (if required for first run):**
   ```bash
   python -m textblob.download_corpora
   ```

5. **Configure environment variables (Optional / Production):**
   Set the following variables or run with default local fallbacks:
   * `SECRET_KEY`: Django secret key
   * `DEBUG`: `True` or `False`
   * `DATABASE_URL`: Connection string for PostgreSQL (defaults to SQLite if unset)
   * `EMAIL_HOST_USER`: SMTP email username
   * `EMAIL_HOST_PASSWORD`: SMTP email password

6. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   *The backend will run on `http://127.0.0.1:8000/`.*

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Configure API base URL:**
   In [frontend/src/App.jsx](frontend/src/App.jsx), set the `API` endpoint:
   ```javascript
   // Local development
   const API = "http://127.0.0.1:8000/api";

   // Or production deployment
   // const API = "https://your-production-backend.onrender.com/api";
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173/`.*

---

## Database Schema

### `TextAnalysis`
| Field | Type | Description |
|---|---|---|
| `id` | BigAutoField | Primary Key |
| `user` | ForeignKey (`auth.User`) | Owner of the analysis record (cascading delete) |
| `text` | TextField | Evaluated text input |
| `sentiment` | CharField(20) | Output category (`Positive`, `Negative`, `Neutral`) |
| `polarity` | FloatField | Computed polarity score (`-1.0` to `+1.0`) |
| `created_at` | DateTimeField | Timestamp of execution |

### `PasswordResetToken`
| Field | Type | Description |
|---|---|---|
| `id` | BigAutoField | Primary Key |
| `user` | ForeignKey (`auth.User`) | Target user account |
| `token` | CharField(100) | Unique URL-safe reset token |
| `created_at` | DateTimeField | Token generation timestamp (used for 15-minute expiry) |

---

## Production Deployment Notes
* **Database:** Production configuration natively binds to PostgreSQL using `dj_database_url` when `DATABASE_URL` is set in the environment.
* **Static Assets:** Static files are collected to `staticfiles/` via `python manage.py collectstatic` for serving through reverse proxies or CDN.
* **WSGI Worker:** Configured for deployment with `gunicorn` (`server.wsgi:application`).
* **CORS:** Controlled via `django-cors-headers` (currently configured for cross-origin client interaction).

