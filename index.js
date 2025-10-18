import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session expires after 1 day
    },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  // The isAuthenticated() method is provided by Passport.js
  if (req.isAuthenticated()) {
    try {
      // It's good practice to fetch the latest user data.
      // The req.user object comes from the deserialized session.
      const result = await db.query(
        `SELECT secret FROM users WHERE id = $1`,
        [req.user.id]
      );
      
      const secret = result.rows.length > 0 ? result.rows[0].secret : null;

      if (secret) {
        res.render("secrets.ejs", { secret: secret });
      } else {
        // Provide a default message if the user has not submitted a secret yet.
        res.render("secrets.ejs", { secret: "You haven't submitted a secret yet. Why not share one?" });
      }
    } catch (err) {
      console.log(err);
      // It's good to have a fallback or error page.
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      // BUG FIX: Changed from req.redirect to res.redirect and added a return statement.
      // This prevents the code from continuing to execute and trying to register a user that already exists.
      return res.redirect("/login");
    } else {
      // Move the hashing logic inside the 'else' block
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          // It's good practice to send a response to the user on error.
          return res.status(500).send("Error registering user.");
        }
        
        const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
          [email, hash]
        );
        const user = result.rows[0];
        
        // Log the user in automatically after registration
        req.login(user, (err) => {
          if (err) {
            console.error("Login after registration failed:", err);
            return res.redirect("/login");
          }
          console.log("Registration and login successful");
          res.redirect("/secrets");
        });
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
});

app.post("/submit", async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  const submittedSecret = req.body.secret;
  try {
    // Use the user ID from the session to ensure we update the correct user.
    await db.query(`UPDATE users SET secret = $1 WHERE id = $2`, [
      submittedSecret,
      req.user.id,
    ]);
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  "local",
  new LocalStrategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);

      if (result.rows.length === 0) {
        return cb(null, false, { message: "Incorrect username or password." });
      }
      
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      
      // Do not compare passwords for Google-authenticated users
      if (storedHashedPassword === 'google') {
        return cb(null, false, { message: "Please sign in with Google." });
      }

      bcrypt.compare(password, storedHashedPassword, (err, valid) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return cb(err);
        } else {
          if (valid) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        }
      });
    } catch (err) {
      console.log(err);
      return cb(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          // User already exists
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

// This function saves the user's ID to the session cookie.
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

// This function retrieves the user's details from the database using the ID from the session.
passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error('User not found'));
    }
  } catch (err) {
    cb(err);
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
