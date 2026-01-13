# Modern Logistic Website

A premium, responsive logistics and transport website featuring shipment tracking, service management, and a full-featured Admin CMS. Built with Node.js, Express, and EJS.

## 🚀 Features

### Frontend (Public)
- **Modern Design**: Responsive, high-quality aesthetics with animations and a clean UI.
- **Services Page**: Showcasing Air, Sea (Visuals of ships), Road (Trucks), and Warehousing services.
- **Shipment Tracking**: Real-time checking of cargo status by Tracking ID.
- **Get a Quote**: Interactive form for customers to request shipping rates.
- **Ghana-Specific**: Tailored services for shipping to/from Ghana ports.
- **User Portal**: User Registration and Login for personalized experiences.

### Backend (Admin CMS)
- **Dashboard**: Overview of recent shipments and messages.
- **Shipment Manager**: Create, update, and delete shipments. Update status (Pending, In Transit, Delivered) and location.
- **Service Manager**: Dynamic control over the "Services" page content.
- **Site Settings**: easy update of Logo, Brand Colors, Phone, Email, and Address without touching code.
- **Secure Auth**: Admin and User role-based authentication.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Templating), CSS3 (Custom Design System), JavaScript
- **Database**: SQLite (Zero-config, single file database)
- **Dependencies**: `bcrypt` (Security), `express-session` (Auth), `multer` (Uploads)

## 📦 Installation & Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the Server**
    ```bash
    npm start
    ```
    The server will run at `http://localhost:3000`.

3.  **Default Admin Credentials**
    - **Login URL**: `/admin/login`
    - **Username**: `admin`
    - **Password**: `admin123`

## 🌍 Deployment (Railway / Cloud)
This project is optimized for simple deployment on platforms like Railway, Render, or Heroku.
- **Database**: Uses SQLite (`logistic.db`). **Note**: On ephemeral file systems (like free Railway/Heroku tiers), data resets on restart. For production, switch to a hosted database or use persistent volumes.

## � Project Structure
- `/public`: Static assets (CSS, Images, JS)
- `/views`: EJS Templates (HTML with logic)
- `/routes`: Express route controllers
- `/db`: Database connection and initialization
