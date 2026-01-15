const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcryptjs = require('bcryptjs');

// Auth Routes
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
        if (user && await bcryptjs.compare(password, user.password)) {
            req.session.user = user;
            if (user.role === 'admin') return res.redirect('/admin/dashboard');
            res.redirect('/');
        } else {
            res.render('login', { title: 'Login', error: 'Invalid Credentials' });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login', error: 'Error logging in' });
    }
});

router.get('/register', (req, res) => {
    res.render('register', { title: 'Register', error: null });
});

router.post('/register', async (req, res) => {
    const { username, password, confirm_password } = req.body;
    if (password !== confirm_password) {
        return res.render('register', { title: 'Register', error: 'Passwords do not match' });
    }

    try {
        const hashedPassword = await bcryptjs.hash(password, 10);
        await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hashedPassword]);
        res.redirect('/login');
    } catch (e) {
        res.render('register', { title: 'Register', error: 'Username already exists or error creating user' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// Home
router.get('/', async (req, res) => {
    try {
        const services = await db.all("SELECT * FROM services LIMIT 3", []);
        res.render('index', { title: 'Home', services: services });
    } catch (err) {
        res.render('index', { title: 'Home', services: [] });
    }
});

// Services
router.get('/services', async (req, res) => {
    try {
        const services = await db.all("SELECT * FROM services", []);
        res.render('services', { title: 'Our Services', services: services });
    } catch (err) {
        res.render('services', { title: 'Our Services', services: [] });
    }
});

// Tracking
router.get('/tracking', async (req, res) => {
    const trackingId = req.query.id;
    let shipment = null;
    let error = null;

    if (trackingId) {
        try {
            shipment = await db.get("SELECT * FROM shipments WHERE tracking_number = ?", [trackingId]);
            if (!shipment) {
                error = "Shipment not found";
            }
        } catch (err) {
            error = "Database error";
        }
    }
    res.render('tracking', { title: 'Track Shipment', shipment: shipment, error: error, trackingId: trackingId || '' });
});

// About
router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Contact
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

// Get Quote
router.get('/quote', (req, res) => {
    res.render('quote', { title: 'Get a Quote' });
});

// Handle Quote Submission (Simple logging or DB save)
router.post('/quote', async (req, res) => {
    const { name, email, details } = req.body;
    try {
        await db.run("INSERT INTO messages (name, email, subject, message) VALUES (?, ?, 'Quote Request', ?)",
            [name, email, details]);
        res.redirect('/quote?success=true');
    } catch (err) {
        console.error(err);
        res.redirect('/quote?error=true');
    }
});

// Handle Contact Submission
router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        await db.run("INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
            [name, email, subject, message]);
        res.redirect('/contact?success=true');
    } catch (err) {
        console.error(err);
        res.redirect('/contact?error=true');
    }
});

module.exports = router;
