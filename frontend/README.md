# SmartEvent

**Intelligent Event Booking, Gamification & Analytics Platform**

SmartEvent is a modern, premium SaaS event booking platform designed to demonstrate the power of Advanced SQL. It features intelligent event discovery, an interactive seat mapping system, simulated booking workflows, user gamification (XP, leaderboards, quizzes), and an organizer analytics dashboard powered by complex database queries.

## Features

- **Event Discovery:** Search by name, category, or location with robust filtering.
- **Personalized Recommendations:** Displays AI-like compatibility scores (driven by backend SQL matching algorithms).
- **Interactive Seat Selection:** Real-time seating maps with variable pricing tiers (Standard, Premium).
- **Booking Flow & Digital Tickets:** Seamless cart summary and simulated checkout leading to a generated QR-code ticket.
- **Gamification System:** 
  - Earn XP for bookings and attending events.
  - Unlock achievements and level up.
  - Compete on Global, Weekly, and College Leaderboards.
  - Take quizzes to earn additional XP.
- **Admin Analytics Dashboard:** Powerful data visualization demonstrating:
  - Revenue Over Time (Powered by SQL Window Functions / CTEs)
  - Bookings by Category (GROUP BY aggregations)
  - Top Performing Events (JOINs and Dense Ranks)

## Technology Stack

**Frontend:**
- React 19
- Vite
- React Router (Client-side routing)
- Tailwind CSS v4 (Premium glassmorphism, modern aesthetics)
- Recharts (Data visualization)
- Lucide React (Iconography)
- Axios (API Communication)

**Backend:**
- Python / Flask (REST API)
- PostgreSQL (Advanced SQL Implementation)

## Advanced SQL Concepts Demonstrated

The frontend UI is specifically designed to visualize the results of the following Advanced SQL techniques happening in the backend:
- **Joins:** Combining event, venue, user, and booking data for comprehensive dashboards.
- **Subqueries & CTEs:** Used for complex revenue calculations, moving averages, and event performance tracking.
- **Window Functions:** utilized for ranking users on the leaderboard and tracking running revenue totals.
- **Stored Procedures & Transactions:** Ensuring atomic booking and seat reservation processes without race conditions.

## Project Architecture

```
User Action (React) → API Call (Axios) → Backend Route (Flask) → Database Query (Advanced SQL) → Response Data → UI Update
```

## Installation & Setup

1. **Clone the repository and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

*(Note: The frontend API service defaults to `http://localhost:5000/api` if no variable is provided.)*
