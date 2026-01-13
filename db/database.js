const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'logistic.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Site Settings
        db.run(`CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY,
            key TEXT UNIQUE,
            value TEXT
        )`);

        // Users (Admin) - We will seed a default admin later if not exists
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'admin'
        )`);

        // Services
        db.run(`CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            image TEXT
        )`);

        // Tracking
        db.run(`CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT UNIQUE,
            sender_name TEXT,
            receiver_name TEXT,
            status TEXT, -- Pending, In Transit, Delivered, Held
            origin TEXT,
            destination TEXT,
            current_location TEXT,
            estimated_delivery TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Messages/Contacts
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            subject TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Seed default settings if empty
        db.get("SELECT count(*) as count FROM site_settings", (err, row) => {
            if (row.count === 0) {
                const settings = [
                    { key: 'site_name', value: 'Ghana Logistics' },
                    { key: 'contact_email', value: 'info@ghanalogistics.com' },
                    { key: 'contact_phone', value: '+233 20 000 0000' },
                    { key: 'address', value: 'Accra, Ghana' },
                    { key: 'primary_color', value: '#1a73e8' }
                ];
                const stmt = db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?)");
                settings.forEach(s => stmt.run(s.key, s.value));
                stmt.finalize();
            }
        });
    });
}

module.exports = db;
