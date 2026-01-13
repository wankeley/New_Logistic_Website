const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/database');

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/admin/login');
};

// Login GET
router.get('/login', (req, res) => {
    res.render('admin/login', { title: 'Admin Login', error: null });
});

// Login POST
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return console.error(err);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { title: 'Admin Login', error: 'Invalid Credentials' });
        }
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM messages ORDER BY created_at DESC LIMIT 5", (err, messages) => {
        db.all("SELECT * FROM shipments ORDER BY created_at DESC LIMIT 5", (err, shipments) => {
            res.render('admin/dashboard', { title: 'Admin Dashboard', messages, shipments });
        });
    });
});

// Settings Management
router.get('/settings', isAuthenticated, (req, res) => {
    // Settings are already in res.locals, but let's fetch strictly for editing if needed or just use the global
    res.render('admin/settings', { title: 'Site Settings' });
});

router.post('/settings', isAuthenticated, (req, res) => {
    const settings = req.body; // Key-Value pairs
    const stmt = db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

    Object.keys(settings).forEach(key => {
        stmt.run(key, settings[key]);
    });
    stmt.finalize();
    setTimeout(() => res.redirect('/admin/settings'), 100); // Small delay to ensure DB write
});

// Services Management
router.get('/services', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM services", (err, services) => {
        res.render('admin/services', { title: 'Manage Services', services });
    });
});

router.post('/services/add', isAuthenticated, (req, res) => {
    const { title, description, image } = req.body;
    db.run("INSERT INTO services (title, description, image) VALUES (?, ?, ?)", [title, description, image], (err) => {
        res.redirect('/admin/services');
    });
});

router.get('/services/delete/:id', isAuthenticated, (req, res) => {
    db.run("DELETE FROM services WHERE id = ?", [req.params.id], (err) => {
        res.redirect('/admin/services');
    });
});

// Shipments Management
router.get('/shipments', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM shipments ORDER BY created_at DESC", (err, shipments) => {
        res.render('admin/shipments', { title: 'Manage Shipments', shipments });
    });
});

router.post('/shipments/add', isAuthenticated, (req, res) => {
    const { tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery } = req.body;
    db.run(`INSERT INTO shipments (tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery], (err) => {
            if (err) console.error(err);
            res.redirect('/admin/shipments');
        });
});

router.post('/shipments/update/:id', isAuthenticated, (req, res) => {
    const { current_location, status, estimated_delivery } = req.body;
    db.run("UPDATE shipments SET current_location = ?, status = ?, estimated_delivery = ? WHERE id = ?",
        [current_location, status, estimated_delivery, req.params.id], (err) => {
            res.redirect('/admin/shipments');
        });
});

module.exports = router;
