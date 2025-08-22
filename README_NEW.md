# 💰 Budget Buddy v2.2.1

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase-orange?style=for-the-badge&logo=firebase)](https://finbuddy-2025.web.app)
[![Version](https://img.shields.io/badge/Version-2.2.1-blue?style=for-the-badge)](https://github.com/theharithsa/budget-buddy/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/theharithsa/budget-buddy/actions)

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![ApexCharts](https://img.shields.io/badge/ApexCharts-Latest-ff5722?style=flat-square)](https://apexcharts.com/)

A comprehensive personal finance analytics platform built with React, TypeScript, and Firebase. Track expenses, analyze spending behavior, and transform your financial habits with AI-powered insights and professional Flowbite charts.

🌐 **Live Application**: [https://finbuddy-2025.web.app](https://finbuddy-2025.web.app)

## ✨ Latest Updates (v2.2.1)

### 🐛 Critical Bug Fix Release

- **Dashboard Grid Layout Fixed**: Summary Cards now properly display in 4-column grid on desktop screens
- **Theme Context Issues Resolved**: Fixed dark mode theme switching across all components  
- **PWA Install Banner**: Fixed theme responsiveness for proper light/dark mode support
- **Responsive Layout**: Enhanced CSS Grid implementation with auto-responsive column distribution

Previous major release (v2.2.0) included complete Flowbite Charts redesign with ApexCharts integration.

### 🎨 Complete Flowbite Charts Redesign

- **ApexCharts Integration** - Migrated to industry-standard ApexCharts library for superior performance
- **Authentic Flowbite Design** - Pixel-perfect implementation of Flowbite design patterns
- **Professional Chart Types** - Area charts, column charts, pie charts, and donut charts with gradient fills
- **Enhanced KPI Displays** - Large metrics with growth indicators and status badges
- **Interactive Features** - Hover states, tooltips, and smooth animations
- **Grid Layout System** - Responsive 2x2 chart grid optimized for all screen sizes

### 📊 Advanced Data Visualization

- **Area Charts** - Monthly spending trends with gradient backgrounds and growth metrics
- **Column Charts** - Weekly spending breakdown with rounded columns and comparative data
- **Pie Charts** - Category distribution with Flowbite color palette and interactive legends
- **Donut Charts** - Budget performance tracking with center statistics and status indicators
- **Smart Tooltips** - Context-aware data display with formatted currency and percentages
- **Responsive Design** - Charts adapt seamlessly to mobile, tablet, and desktop viewports

## ✨ Core Features

### 📊 Professional Data Visualization

- **ApexCharts Library** - Industry-leading chart library with enterprise-grade features
- **Flowbite Design System** - Consistent professional styling across all components
- **Multiple Chart Types** - Area, column, pie, and donut charts with advanced customization
- **Real-time Updates** - Charts automatically refresh with new expense data
- **Dark Mode Support** - Perfect contrast ratios and theme consistency
- **Export Capabilities** - Download charts as images or data exports

### 💳 Financial Management

- **Smart Expense Tracking** - Quick logging with receipt uploads and categorization
- **Dynamic Budget Management** - Set and monitor spending limits with real-time alerts
- **Recurring Templates** - Automate frequently used transactions
- **Multi-Person Tracking** - Track shared expenses and relationships

### 📊 Advanced Analytics Dashboard

- **Comprehensive Charts** - 12+ visualization types including trends, patterns, and distributions
- **Tabbed Interface** - Overview, Advanced, Behavior, Achievements, and Budget tabs
- **Interactive Visualizations** - Hover tooltips, animations, and responsive design
- **Time-Series Analysis** - Monthly trends, weekly patterns, and historical comparisons

### 🧠 Behavioral Insights Engine

- **Spending Behavior Analysis** - Identify patterns, habits, and spending psychology
- **Impulse Purchase Detection** - AI-powered flagging of impulsive spending
- **Needs vs Wants Classification** - Categorize expenses into essential vs discretionary
- **Consistency Scoring** - Measure and track spending predictability
- **Pattern Recognition** - Weekly, monthly, and seasonal spending trends

### 🏆 Gamification System

- **Achievement Badges** - 8+ achievements across tracking, saving, budgeting, and consistency
- **Rarity Tiers** - Common, Rare, Epic, and Legendary achievement levels
- **Point & Level System** - Earn points and level up through financial milestones
- **Financial Score** - Comprehensive health score with component breakdowns
- **Streak Tracking** - Monitor saving streaks and spending-free days

### 🎨 Enhanced User Experience

- **Improved Theme System** - Better readability with enhanced light/dark mode contrast
- **Smooth Animations** - Interactive hover effects and seamless transitions
- **Mobile Optimized** - Responsive design for all device sizes
- **Quick Actions** - Easy access to common tasks from dashboard

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/theharithsa/budget-buddy.git
   cd budget-buddy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase** (see [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md))

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5000`

## 📁 Project Structure

```
budget-buddy/
├── src/                    # Application source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and Firebase config
│   └── styles/            # CSS and styling
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
└── public/                # Static assets
```

## 📚 Documentation

All documentation is organized in the [`docs/`](./docs/) folder:

- **[Setup Guide](./docs/FIREBASE_SETUP.md)** - Complete setup instructions
- **[Product Requirements](./docs/PRD.md)** - Detailed feature specifications
- **[AI Testing Guide](./docs/AI_ANALYZER_TEST_GUIDE.md)** - How to test AI features
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Deploy outside GitHub Spark
- **[Dynatrace Integration](./docs/DYNATRACE_GITHUB_SETUP.md)** - Observability setup
- **[Version Management](./docs/VERSION_MANAGEMENT.md)** - Release workflow

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Icons**: Lucide React
- **Charts**: ApexCharts with Flowbite design
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: GPT-4 integration for budget analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 Version Management

Budget Buddy follows [Semantic Versioning](https://semver.org/) with automated changelog management.

**Current Version**: `2.2.1`

### Quick Version Bumps

```bash
# New features
npm run version:minor "Added new feature description"

# Bug fixes  
npm run version:patch "Fixed bug description"

# Breaking changes
npm run version:major "Major change description"
```

See [docs/VERSION_MANAGEMENT.md](./docs/VERSION_MANAGEMENT.md) for detailed guidelines and [CHANGELOG.md](./CHANGELOG.md) for release history.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [GitHub Spark](https://githubnext.com/projects/spark) template
- Icons by [Lucide](https://lucide.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Charts powered by [ApexCharts](https://apexcharts.com/)
- Design system by [Flowbite](https://flowbite.com/)
