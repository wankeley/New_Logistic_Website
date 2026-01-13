const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcrypt');

// Auth Routes
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return console.error(err);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            if (user.role === 'admin') return res.redirect('/admin/dashboard');
            res.redirect('/');
        } else {
            res.render('login', { title: 'Login', error: 'Invalid Credentials' });
        }
    });
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
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hashedPassword], (err) => {
            if (err) {
                return res.render('register', { title: 'Register', error: 'Username already exists' });
            }
            res.redirect('/login');
        });
    } catch (e) {
        res.render('register', { title: 'Register', error: 'Error creating user' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// Home
router.get('/', (req, res) => {
    db.all("SELECT * FROM services LIMIT 3", (err, services) => {
        res.render('index', { title: 'Home', services: services });
    });
});

// Services
router.get('/services', (req, res) => {
    db.all("SELECT * FROM services", (err, services) => {
        res.render('services', { title: 'Our Services', services: services });
    });
});

// Tracking
router.get('/tracking', (req, res) => {
    const trackingId = req.query.id;
    let shipment = null;
    let error = null;

    if (trackingId) {
        db.get("SELECT * FROM shipments WHERE tracking_number = ?", [trackingId], (err, row) => {
            if (err) {
                error = "Database error";
            } else if (!row) {
                error = "Shipment not found";
            } else {
                shipment = row;
            }
            res.render('tracking', { title: 'Track Shipment', shipment: shipment, error: error, trackingId: trackingId });
        });
    } else {
        res.render('tracking', { title: 'Track Shipment', shipment: null, error: null, trackingId: '' });
    }
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
router.post('/quote', (req, res) => {
    // In a real app, send email or save to DB
    // For now, let's save to messages
    const { name, email, details } = req.body;
    db.run("INSERT INTO messages (name, email, subject, message) VALUES (?, ?, 'Quote Request', ?)",
        [name, email, details], (err) => {
            if (err) console.error(err);
            res.redirect('/quote?success=true');
        });
});

// Handle Contact Submission
router.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    db.run("INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
        [name, email, subject, message], (err) => {
            if (err) console.error(err);
            res.redirect('/contact?success=true');
        });
});

module.exports = router;
