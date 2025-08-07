# FocusMate AI – Smart Productivity Assistant

A clean, modern productivity dashboard built for young professionals featuring AI-powered insights, Pomodoro timer, journaling, and analytics with beautiful Framer Motion animations.

## 🚀 Features

- **Dashboard**: 3-column layout with daily tasks, AI assistant, Pomodoro timer, and mood tracking
- **Smart Navigation**: Sidebar navigation with clean, modern design
- **Task Management**: Interactive task list with priority levels and completion tracking
- **AI Integration**: GPT-powered responses and productivity tips
- **Pomodoro Timer**: Focus timer with customizable durations
- **Mood Tracking**: Daily mood selector for productivity insights
- **Progress Analytics**: Weekly progress tracking and statistics with advanced Chart.js visualizations
- **Smooth Animations**: Beautiful Framer Motion animations throughout the app
- **Database Integration**: Full PostgreSQL database with Neon for persistent storage
- **Dark Mode**: Complete dark theme support with system preference detection
- **Responsive Design**: Mobile-first responsive layout with adaptive navigation



### 🚀 Database Setup Steps
1. **Environment Setup**: Copy `.env.example` to `.env` with the provided credentials
2. **Run Migrations**: Set up the database schema
```bash
npm run migrate
```
3. **Seed Data** (Optional): Add sample data for testing
```bash
npm run db:seed
```

### 🌩️ Neon Serverless Database Integration

#### Server-side Access
We use optimized connection pooling for server-side database access with improved connection handling for serverless functions:

```javascript
// Example connection from serverless function
const { getPool } = require('./db-utils');
const pool = await getPool();
const result = await pool.query('SELECT * FROM users');
```

#### Client-side Direct Database Access
For client components, we've implemented a secure direct database access pattern using Neon's serverless driver:

1. **Security Features**:
   - JWT authentication for database connections
   - Row Level Security (RLS) for data isolation
   - Host information provided via secure API endpoint

2. **Usage Example**:
```tsx
// Using the custom hook
const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
```

3. **Setup RLS Policies**:
```bash
node scripts/db-setup-rls.js
```

Learn more about this implementation in [docs/neon-client-security.md](docs/neon-client-security.md)

---

## 🎨 Design System

- **Typography**: Inter font family
- **Colors**: Indigo/white palette with purple accents
- **UI Elements**: Rounded cards, subtle gradients, clean layouts
- **Icons**: Lucide React icons throughout

## 🏗️ Project Status

### ✅ Completed
- [x] Set up React project with Tailwind CSS
- [x] Configured PostCSS and Tailwind
- [x] Added Inter font and style guide colors
- [x] Created project structure (components, pages, hooks)
- [x] **Built Dashboard Page** with 3-column layout:
  - Left: Daily tasks with add/complete functionality
  - Middle: AI assistant card and Pomodoro timer
  - Right: Mood selector and quick actions
- [x] Implemented Sidebar Navigation
- [x] Set up React Router for page navigation
- [x] Added responsive layout system
- [x] **Authentication System**:
  - Login page with gradient background and centered card
  - Sign up page with form validation
  - Proper routing structure (/login, /signup, /app/*)
  - Demo credentials for testing

### 🚧 In Progress
- [x] Implement Login Page (centered card, logo, inputs, gradient background)
- [x] Create Pomodoro Page (timer, controls, AI feedback)
- [x] Develop Journal Page (split layout, entry list, textarea, AI reply)
- [x] Implement Stats Page (charts for productivity, tasks, mood)
- [x] Integrate GPT/AI features for responses and tips
- [x] Add working Pomodoro timer functionality
- [x] Set up PostgreSQL database integration
- [x] Enhance UI animations and transitions

### 📋 Upcoming
- [x] Enhanced user authentication with JWT tokens
- [x] Data persistence with Neon PostgreSQL
- [x] Advanced analytics and charts
- [x] AI-powered productivity insights
- [x] Dark mode support
- [x] Mobile responsiveness enhancements

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Animations**: Framer Motion 12.23.9 for smooth UI transitions
- **Styling**: Tailwind CSS 3.4.17
- **Routing**: React Router DOM 6.28.0
- **Icons**: Lucide React 0.525.0
- **Build Tool**: Create React App with CRACO for webpack customization
- **Database**: PostgreSQL with Neon serverless platform
- **Authentication**: Neon Auth with Stack integration + JWT verification
- **Data Access**: Node-Postgres (pg) for database operations
- **Charts**: Chart.js with react-chartjs-2 for advanced analytics
- **AI Integration**: OpenAI GPT integration for productivity insights
- **Theme**: Dark/Light mode with system preference detection

## 🚀 Getting Started

### Prerequisites
- Node.js (v22.14.0 or higher)
- npm (v10.9.2 or higher)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd focusmate-ai
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run start:3002
```

4. Open [http://localhost:3002](http://localhost:3002) to view the app

The application will automatically redirect to the Dashboard page.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── AnimatedPage.tsx # Page transition wrapper
│   ├── FloatingCard.tsx # Animated card component
│   └── StaggeredList.tsx # Animated list component
├── context/            # React context providers
│   └── DataContext.tsx # Mock data access provider
├── models/             # TypeScript interfaces for data models
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Main dashboard with animations
│   ├── Login.tsx       # Animated login page
│   ├── Pomodoro.tsx    # Pomodoro timer page
│   ├── Journal.tsx     # Journal/notes page
│   ├── Stats.tsx       # Analytics page
│   └── Profile.tsx     # User profile page
├── services/           # Mock data service functions
├── utils/              # Helper functions
│   └── db.ts           # Mock database utility
├── hooks/              # Custom React hooks
├── App.tsx             # Main app component with routing
└── index.tsx           # Application entry point
```

## 🎯 Current Features

The application is a **complete frontend demo** with beautiful animations and full functionality:

- **🎨 Beautiful Animations**: Smooth Framer Motion animations throughout the app
- **🔐 Authentication**: Polished login and sign-up pages with animated form fields
- **📊 Dashboard**: Interactive task management with staggered card reveals
- **🍅 Pomodoro Timer**: Complete timer functionality with session tracking and mood selection
- **📝 Journal**: Entry management with mood tracking and AI-powered insights (mock)
- **📈 Stats Page**: Comprehensive analytics with animated charts
- **👤 Profile Page**: User management with settings and achievements
- **🎭 Mock AI**: Simulated AI responses and productivity tips

### 🔐 Demo Authentication
- Use any email/password combination to "log in"
- The app demonstrates the complete authentication flow
- All user data is stored locally for the demo session

### ✨ Animation Highlights
- Page transitions with smooth fade and scale effects
- Staggered reveals for lists and cards
- Interactive hover and tap animations
- Form field focus effects and validation feedback
- Loading states and micro-interactions

---

*This is a portfolio/demo project showcasing modern React development with beautiful animations*

---

*Built with ❤️ for productivity enthusiasts*
