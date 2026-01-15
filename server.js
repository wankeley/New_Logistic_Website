require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcryptjs = require('bcryptjs');
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
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;

    // Load site settings for every view
    try {
        const rows = await db.all("SELECT key, value FROM site_settings", []);
        const settings = {};
        if (rows) {
            rows.forEach(row => {
                settings[row.key] = row.value;
            });
        }
        res.locals.settings = settings;
    } catch (err) {
        console.error('Error loading settings:', err);
        res.locals.settings = {};
    }
    next();
});

// Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// Seed Admin User
const seedAdmin = async () => {
    try {
        const row = await db.get("SELECT * FROM users WHERE username = 'admin'", []);
        if (!row) {
            const hashedPassword = await bcryptjs.hash('admin123', 10);
            await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hashedPassword, 'admin']);
            console.log("Admin user created: admin / admin123");
        }
    } catch (err) {
        console.error('Error seeding admin:', err);
    }
};

// Start server only after DB is ready
db.ready().then(() => {
    seedAdmin();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});