# BreakTrack

BreakTrack is a full-stack application designed to manage and track agent breaks and statuses in real-time. It provides distinct dashboards for Agents, Managers, and Super Admins to ensure efficient workflow and monitoring.

## Features

- **Real-time Status Tracking**: Live updates of agent statuses (Online, On Break, Offline) using Socket.io.
- **Role-Based Access Control**:
  - **Agent Dashboard**: Manage own status and request breaks.
  - **Manager Dashboard**: Monitor team status and view break history.
  - **Super Admin Dashboard**: Oversee system-wide settings and users.
- **Break Management**: Track break durations and types.
- **Secure Authentication**: JWT-based authentication for secure access.
- **Email Notifications**: Automated alerts using Nodemailer.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State/Networking**: [Axios](https://axios-http.com/), [Socket.io Client](https://socket.io/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Authentication**: JSON Web Tokens (JWT), BcryptJS
- **Utilities**: Nodemailer, Dotenv, Cors

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL installed and running

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd BreakTrack
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    ```
    - Create a `.env` file in the `backend` directory and configure your environment variables (DATABASE_URL, JWT_SECRET, etc.).
    - Run database migrations:
      ```bash
      npx prisma migrate dev
      ```
    - Start the backend server:
      ```bash
      npm run dev
      ```

3.  **Frontend Setup**
    ```bash
    cd ../frontend
    npm install
    ```
    - Start the frontend development server:
      ```bash
      npm run dev
      ```

## Scripts

### Backend
- `npm run dev`: Runs the server in development mode with hot reloading.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled production server.

### Frontend
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Locally preview the production build.
