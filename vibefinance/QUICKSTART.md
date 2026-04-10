# VibeFinance - Quick Start Guide

Get up and running with VibeFinance in under 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (optional, for version control)

## Installation

### 1. Install Dependencies

```bash
cd vibefinance
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

That's it! The app is running with **mock data** and ready to use.

---

## What You Can Do Right Now

✅ **View Dashboard** - See your portfolio overview with charts  
✅ **Explore Portfolio** - View holdings, allocation, and recent transactions  
✅ **Check Watchlist** - Monitor assets you're interested in  
✅ **Export to CSV** - Download your portfolio data  
✅ **Toggle Theme** - Switch between dark and light mode  
✅ **Browse Assets** - Click any stock ticker to see detailed charts  
✅ **Mobile View** - Fully responsive design  

---

## Next Steps (Optional)

### Connect Real Data

To use live market data instead of mock data:

1. **Get Polygon.io API Key** (free tier available)
   - Sign up at https://polygon.io
   - Get your API key from the dashboard
   - Add to `.env.local`:
     ```
     VITE_POLYGON_API_KEY=your_key_here
     ```

2. **Set Up Supabase Backend**
   - Create project at https://supabase.com
   - Run the SQL schema from `plans/supabase-setup.md`
   - Add credentials to `.env.local`:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

Full setup instructions are in [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## Project Structure

```
vibefinance/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages (Dashboard, Portfolio, etc.)
│   ├── lib/            # Utilities, API clients, mock data
│   └── types/          # TypeScript interfaces
├── plans/              # Architecture documentation
└── public/             # Static assets
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Key Features

### 📊 Portfolio Tracking
- Real-time portfolio value
- Gain/loss calculations
- Asset allocation charts
- Transaction history

### 📈 Market Data
- Live price updates (with API)
- Historical price charts
- Daily change indicators
- Asset details and news

### 🎨 Modern UI
- Dark/light theme toggle
- Responsive design
- Smooth animations
- Accessible components

### 📱 Mobile Optimized
- Touch-friendly interface
- Hamburger navigation
- Responsive tables
- PWA-ready

---

## Demo Accounts

The app includes **mock data** for demonstration:

- **6 sample assets:** AAPL, MSFT, GOOGL, TSLA, SPY, BTC-USD
- **4 portfolio holdings** with realistic prices
- **3 transaction records**
- **2 watchlist items**

You can immediately explore all features without any setup!

---

## Troubleshooting

### Port Already in Use
```bash
# Kill the process on port 5173
npx kill-port 5173
npm run dev
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf .vite
npm run build
```

---

## Need Help?

- 📖 **Full Documentation:** [`README.md`](./README.md)
- 🏗️ **Architecture:** [`plans/vibefinance-architecture.md`](./plans/vibefinance-architecture.md)
- 🚀 **Deployment:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- 📊 **Project Status:** [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)

---

## What's Next?

1. **Explore the UI** - Click around and test features
2. **Check the Code** - Browse components in `src/`
3. **Read the Docs** - Learn about the architecture
4. **Deploy It** - Follow the deployment guide
5. **Customize** - Make it your own!

---

**Happy coding! 🎉**

Built with React 19, TypeScript, and Tailwind CSS
