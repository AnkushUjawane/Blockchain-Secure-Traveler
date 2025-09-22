# 🛡️ Aegis - Smart Tourist Safety Monitoring

A real-time safety navigator that protects tourists and citizens from natural disasters using predictive analytics.

## Features

- **Real-Time Risk Map**: Live visualization of danger zones with color-coded risk levels
- **Safe Route Planner**: Find the safest path avoiding high-risk areas
- **Emergency SOS System**: Instant alert system connecting users with rescue teams
- **Admin Dashboard**: Control center for monitoring alerts and risk zones

## Quick Start

### Backend Setup
```bash
cd aegis-backend
npm install
npm start
```

### Frontend Setup
```bash
cd aegis-frontend
npm install
npm run dev
```

## Demo Flow

1. **Start Backend**: Server runs on http://localhost:3001
2. **Start Frontend**: App runs on http://localhost:5173
3. **View Risk Map**: See live risk zones updating every 5 seconds
4. **Test Route Planning**: Enter start/end points to get safe routes
5. **Try SOS**: Click emergency button to send alert
6. **Admin View**: Visit /admin to see control center

## Tech Stack

- **Frontend**: React + Vite, Mapbox GL JS, Tailwind CSS
- **Backend**: Node.js + Express, WebSockets
- **Real-time**: WebSocket communication
- **Geospatial**: Turf.js for route analysis

## Hackathon Ready

This prototype demonstrates the complete concept with:
- Live risk prediction engine
- Interactive mapping interface
- Real-time emergency system
- Professional admin dashboard

Perfect for showcasing the full Smart Tourist Safety Monitoring solution!