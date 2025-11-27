# 🔐 Secrets - Anonymous Confession App

A secure, full-stack web application that allows users to register, authenticate securely, and share personal secrets. This project demonstrates robust backend security practices integrated with a modern, responsive frontend.

## 🌐 Live Demo
[View Live Application](https://secrets-app-r8zw.onrender.com/) *(Replace with your actual deployment URL)*

---

## 🛠️ Tech Stack

### Backend
- **Node.js & Express.js**: Server-side runtime and framework.
- **PostgreSQL**: Relational database for persistent storage.
- **Passport.js**: Authentication middleware implementing:
  - **Local Strategy**: Email/Password login.
  - **Google OAuth 2.0**: Secure third-party authentication.
- **Bcrypt**: Industry-standard library for hashing and salting passwords.
- **Express-Session**: Handling user sessions and cookies.

### Frontend
- **EJS (Embedded JavaScript)**: Server-side templating engine.
- **Bootstrap 4**: Responsive grid system and components.
- **Custom CSS**: Modern glassmorphism UI with linear gradients.
- **FontAwesome**: Iconography.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- A Google Cloud Project (for OAuth credentials)

---

## 🚀 Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/secrets-app.git
cd secrets-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
# Database Configuration
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=secrets
PG_PASSWORD=your_local_db_password
PG_PORT=5432

# Session Security
SESSION_SECRET=your_super_secret_random_string

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:3000/auth/google/secrets
```

### 4. Setup the Database
Open your SQL command line tool (`psql` or pgAdmin) and run the following commands to create the database and table:

```sql
CREATE DATABASE secrets;

\c secrets -- Connect to the database

CREATE TABLE users(
   id SERIAL PRIMARY KEY,
   email VARCHAR(100) NOT NULL UNIQUE,
   password VARCHAR(100),
   secrets TEXT
);
```

### 5. Start the Server
```bash
node index.js
# OR if you have nodemon installed
nodemon index.js
```

Visit `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
├── public/
│   └── css/
│       └── styles.css       # Custom styling
├── views/
│   ├── partials/            # Header.ejs and Footer.ejs
│   ├── home.ejs             # Landing page
│   ├── login.ejs            # Login page with Google/Local options
│   ├── register.ejs         # Registration page
│   ├── secrets.ejs          # Authenticated user dashboard
│   └── submit.ejs           # Secret submission form
├── index.js                 # Main application entry point
├── package.json             # Project metadata and dependencies
└── .env                     # Environment variables (excluded from git)
```

---

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with salt rounds set to 10. Passwords are never stored in plain text.
- **Environment Protection**: Sensitive keys (API secrets, DB passwords) are managed via `.env` and ignored by Git.
- **Session Management**: Uses secure HTTP-only cookies to manage user sessions via `express-session`.
- **SQL Injection Protection**: Uses parameterized queries (`$1`, `$2`) provided by the `pg` library to prevent SQL injection attacks.

---

## ☁️ Deployment (Render)

To deploy this app to Render:

1. Create a **Web Service** connected to your GitHub repo.
2. Create a **PostgreSQL database** on Render.
3. Add the environment variables in the Render dashboard (use the Internal Database URL for `DATABASE_URL`).
4. Update your Google Cloud Console **"Authorized Redirect URIs"** to include your live URL:  
   `https://your-app.onrender.com/auth/google/secrets`.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add some NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ and secure coding practices**
