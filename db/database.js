const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'logistic.db');
let db = null;
let dbInitialized = false;

async function initDb() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    let fileBuffer = null;
    if (fs.existsSync(dbPath)) {
        fileBuffer = fs.readFileSync(dbPath);
    }

    db = new SQL.Database(fileBuffer);

    // Site Settings
    db.run(`CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT
    )`);

    // Users (Admin)
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
        status TEXT,
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
    try {
        const result = db.exec("SELECT count(*) as count FROM site_settings");
        const count = result.length > 0 ? result[0].values[0][0] : 0;

        if (count === 0) {
            const settings = [
                { key: 'site_name', value: 'Ghana Logistics' },
                { key: 'contact_email', value: 'info@ghanalogistics.com' },
                { key: 'contact_phone', value: '+233 20 000 0000' },
                { key: 'address', value: 'Accra, Ghana' },
                { key: 'primary_color', value: '#1a73e8' }
            ];
            settings.forEach(s => {
                db.run("INSERT INTO site_settings (key, value) VALUES (?, ?)", [s.key, s.value]);
            });
        }
    } catch (e) {
        console.log('Settings already seeded or error:', e.message);
    }

    saveDatabase();
    console.log('Connected to the SQLite database.');
    dbInitialized = true;
    return db;
}

function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Initialize on module load
const dbPromise = initDb();

// Export functions for querying
module.exports = {
    ready: async () => {
        await dbPromise;
        return db;
    },
    getDb: async () => {
        if (!db) {
            await dbPromise;
        }
        return db;
    },
    run: async (sql, params = []) => {
        const database = await module.exports.getDb();
        database.run(sql, params);
        saveDatabase();
    },
    get: async (sql, params = []) => {
        const database = await module.exports.getDb();
        const result = database.exec(sql, params);
        if (result.length > 0 && result[0].values.length > 0) {
            const columns = result[0].columns;
            const row = result[0].values[0];
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        }
        return null;
    },
    all: async (sql, params = []) => {
        const database = await module.exports.getDb();
        const result = database.exec(sql, params);
        if (result.length > 0) {
            const columns = result[0].columns;
            return result[0].values.map(row => {
                const obj = {};
                columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                });
                return obj;
            });
        }
        return [];
    },
    prepare: async (sql) => {
        const database = await module.exports.getDb();
        return {
            run: (params) => {
                database.run(sql, params);
                saveDatabase();
            },
            get: (params) => {
                const result = database.exec(sql, params);
                if (result.length > 0 && result[0].values.length > 0) {
                    const columns = result[0].columns;
                    const row = result[0].values[0];
                    const obj = {};
                    columns.forEach((col, idx) => {
                        obj[col] = row[idx];
                    });
                    return obj;
                }
                return null;
            }
        };
    }
};