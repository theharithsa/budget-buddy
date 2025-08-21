# 💰 Budget Buddy

A comprehensive personal finance management application built with React, TypeScript, and Firebase. Track expenses, manage budgets, and get AI-powered insights into your spending patterns.

🌐 **Live Application**: [https://finbuddy.azurewebsites.net](https://finbuddy.azurewebsites.net)

## ✨ Features

- **💳 Expense Tracking** - Quick expense logging with receipt uploads
- **📊 Budget Management** - Set and track spending limits by category
- **🔄 Recurring Templates** - Save frequently used transactions
- **🤖 AI Budget Analyzer** - Get personalized financial insights
- **🔐 Secure Authentication** - Google OAuth integration
- **☁️ Cloud Sync** - Firebase backend for data synchronization
- **🎨 Modern UI** - Beautiful interface with dark/light modes

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

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: GPT-4 integration for budget analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## � Version Management

Budget Buddy follows [Semantic Versioning](https://semver.org/) with automated changelog management.

**Current Version**: `1.2.0`

### Quick Version Bumps
```bash
# New features
npm run version:minor "Added new feature description"

# Bug fixes  
npm run version:patch "Fixed bug description"

# Breaking changes
npm run version:major "Major change description"
```

See [VERSION_MANAGEMENT.md](VERSION_MANAGEMENT.md) for detailed guidelines and [CHANGELOG.md](CHANGELOG.md) for release history.

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [GitHub Spark](https://githubnext.com/projects/spark) template
- Icons by [Lucide](https://lucide.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
