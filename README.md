# SmartEvent — Intelligent Event & Cinema Ticket Booking Engine

SmartEvent is an event booking and live auditorium ticketing platform combining an interactive **WebGL 3D auditorium seat selection experience (Three.js)** with an advanced **relational SQL transactional engine (MySQL 8.0+ InnoDB)**.

---

## Key Highlights

1. **Cinematic 3D & 2D Seat Selection**
   - **Interactive 3D Auditorium:** Rendered via Three.js with realistic seat geometry, raised tier elevations, dynamic lighting, and a glowing curved cinema screen / stage.
   - **"View From This Seat":** Step directly into any selected seat and preview an eye-level sightline facing the screen or stage.
   - **Accessible 2D Fallback:** Keyboard-navigable, touch-friendly 2D grid with clear row labels, aisle spacing, and distinct color/icon indicators for VIP, regular, selected, and locked seats.

2. **Advanced SQL & Database Features**
   - **Target DBMS:** MySQL 8.0 / 8.4 LTS (InnoDB Storage Engine).
   - **Row-Level Concurrency Control:** Enforces `SELECT ... FOR UPDATE` row locks to prevent double-booking during seat hold and checkout.
   - **Server-Side Expiring Holds:** Locks seats for 7 minutes during checkout with an active countdown timer; abandoned seats are released automatically.
   - **CTEs & Window Functions:** Real-time revenue ranking (`DENSE_RANK()`, `PERCENT_RANK()`) and rolling cumulative revenue metrics.
   - **Referential Integrity:** Enforces foreign keys with cascading deletions, unique ticket codes, and attendance audit logs.

3. **Featured Movies & Live Concerts Catalogue**
   - **Blockbuster Movies:** *Ramayana*, *Avengers: Doomsday*, *Dune 3*.
   - **Live Arena Concerts:** *Anirudh Ravichander — Hukum World Tour*, *Sai Abhyankkar — Katchi Sera Live Experience*, *A. R. Rahman — Symphony of Peace World Concert*.
   - *Repeatable, idempotent seed script provided.* All demo listings are clearly tagged.

4. **Security & Financial Integrity**
   - **Password Security:** Salted PBKDF2 / Argon2 hashing via Werkzeug.
   - **Role-Based Access Control:** Strict role segregation (`user`, `admin`).
   - **Decimal-Safe Financials:** 5% convenience fee, 18% GST, and gross totals calculated on the server.
   - **Digital QR Entry Passes:** Unique ticket codes with atomic gate check-in preventing duplicate admissions.

---

## Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Three.js 0.187, Lucide Icons, Axios |
| **Backend** | Python 3.11+, Flask 3.0, Flask-CORS, mysql-connector-python, ItsDangerous |
| **Database** | MySQL 8.0+ InnoDB (ACID compliant, Row-Level Locks) |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MySQL Server 8.0+ (or Docker)

### Option A: Running with Docker Compose (Recommended)

```bash
# Start MySQL 8.0, Flask Backend, and React Frontend
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MySQL: `localhost:3306`

---

### Option B: Local Development Setup

#### 1. Setup MySQL Database
Create the database and ensure MySQL is running on port 3306:
```sql
CREATE DATABASE IF NOT EXISTS smartevent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run table migrations
python create_event_tables.py
python create_more_tables.py

# Seed the required Movies and Concerts catalogue
python seed_movies_and_concerts.py

# Start the Flask Backend
python app.py
```
Backend runs on `http://127.0.0.1:5000`.

#### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## Catalogue Seeding Script

To populate or refresh the 6 requested movies and concerts idempotently:
```bash
cd backend
python seed_movies_and_concerts.py
```
This seeds:
- **Ramayana** (IMAX Recliner VIP, Prime Laser 3D)
- **Avengers: Doomsday** (IMAX 3D Laser VIP, Dolby Atmos Prime)
- **Dune 3** (IMAX Grand Recliner, Executive 4K Atmos)
- **Anirudh Ravichander** (Rockstar Fan Pit Standing, VIP Grandstand)
- **Sai Abhyankkar** (Front Stage VIP, Fan Zone Seated)
- **A. R. Rahman** (Maestro Diamond Lounge, Platinum Front Tier)

---

## Running Automated Tests

Run the test suite covering authentication, catalog filtering, price calculations, and arcade endpoints:
```bash
cd backend
python test_suite.py
```

---

## SQL Documentation & Query Plans

Detailed documentation of all SQL concepts used in the project (including row-level locking, Common Table Expressions, window functions, and `EXPLAIN` query plans) is available in:
[`docs/SQL_SHOWCASE.md`](docs/SQL_SHOWCASE.md)

