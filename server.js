require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key_change_me',
    resave: false,
    saveUninitialized: false
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global Middleware for Site Settings & User Session
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;

    // Load site settings for every view
    db.all("SELECT key, value FROM site_settings", (err, rows) => {
        const settings = {};
        if (rows) {
            rows.forEach(row => {
                settings[row.key] = row.value;
            });
        }
        res.locals.settings = settings;
        next();
    });
});

// Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Seed Admin User (Basic check)
const seedAdmin = async () => {
    db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hashedPassword, 'admin']);
            console.log("Admin user created: admin / admin123");
        }
    });
};
seedAdmin();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
