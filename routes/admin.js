const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
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
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
        if (user && await bcryptjs.compare(password, user.password)) {
            req.session.user = user;
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { title: 'Admin Login', error: 'Invalid Credentials' });
        }
    } catch (err) {
        console.error(err);
        res.render('admin/login', { title: 'Admin Login', error: 'Error logging in' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const messages = await db.all("SELECT * FROM messages ORDER BY created_at DESC LIMIT 5", []);
        const shipments = await db.all("SELECT * FROM shipments ORDER BY created_at DESC LIMIT 5", []);
        res.render('admin/dashboard', { title: 'Admin Dashboard', messages, shipments });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { title: 'Admin Dashboard', messages: [], shipments: [] });
    }
});

// Settings Management
router.get('/settings', isAuthenticated, (req, res) => {
    res.render('admin/settings', { title: 'Site Settings' });
});

router.post('/settings', isAuthenticated, async (req, res) => {
    const settings = req.body;
    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.run("INSERT INTO site_settings (key, value) VALUES (?, ?) ", [key, value]);
        }
        res.redirect('/admin/settings');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/settings');
    }
});

// Services Management
router.get('/services', isAuthenticated, async (req, res) => {
    try {
        const services = await db.all("SELECT * FROM services", []);
        res.render('admin/services', { title: 'Manage Services', services });
    } catch (err) {
        res.render('admin/services', { title: 'Manage Services', services: [] });
    }
});

router.post('/services/add', isAuthenticated, async (req, res) => {
    const { title, description, image } = req.body;
    try {
        await db.run("INSERT INTO services (title, description, image) VALUES (?, ?, ?)", [title, description, image]);
        res.redirect('/admin/services');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/services');
    }
});

router.get('/services/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await db.run("DELETE FROM services WHERE id = ?", [req.params.id]);
        res.redirect('/admin/services');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/services');
    }
});

// Shipments Management
router.get('/shipments', isAuthenticated, async (req, res) => {
    try {
        const shipments = await db.all("SELECT * FROM shipments ORDER BY created_at DESC", []);
        res.render('admin/shipments', { title: 'Manage Shipments', shipments });
    } catch (err) {
        res.render('admin/shipments', { title: 'Manage Shipments', shipments: [] });
    }
});

router.post('/shipments/add', isAuthenticated, async (req, res) => {
    const { tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery } = req.body;
    try {
        await db.run(`INSERT INTO shipments (tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tracking_number, sender_name, receiver_name, origin, destination, current_location, status, estimated_delivery]);
        res.redirect('/admin/shipments');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/shipments');
    }
});

router.post('/shipments/update/:id', isAuthenticated, async (req, res) => {
    const { current_location, status, estimated_delivery } = req.body;
    try {
        await db.run("UPDATE shipments SET current_location = ?, status = ?, estimated_delivery = ? WHERE id = ?",
            [current_location, status, estimated_delivery, req.params.id]);
        res.redirect('/admin/shipments');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/shipments');
    }
});

module.exports = router;
