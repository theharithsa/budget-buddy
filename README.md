# 💰 Finance Tracker

A comprehensive personal finance tracking application with AI-powered insights, Google authentication, receipt storage, and cloud synchronization.

## Features

- **Expense Tracking**: Log expenses with receipt uploads and categorization
- **Budget Management**: Set and monitor monthly budgets with visual progress tracking
- **AI Budget Analyzer**: Get intelligent financial insights and personalized recommendations
- **Recurring Templates**: Streamline entry of recurring bills and subscriptions
- **Spending Trends**: Visual analysis of spending patterns over time
- **Custom Categories**: Create and share custom expense categories
- **Community Features**: Access and contribute to shared budget templates and categories
- **Mobile Optimized**: Responsive design with mobile-specific navigation

## Setup & Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Optional: Enable AI Budget Analyzer with OpenAI API
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Firebase Configuration (required for production)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### AI Budget Analyzer

The AI Budget Analyzer works in multiple modes:

1. **Spark AI** (default): Uses built-in AI when available
2. **OpenAI GPT-4**: When `VITE_OPENAI_API_KEY` is configured
3. **Statistical Analysis**: Smart fallback using built-in algorithms
4. **Demo Mode**: Sample insights for new users

No user configuration required - the system automatically selects the best available option.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Google provider
3. Enable Firestore Database
4. Enable Storage for receipt uploads
5. Configure security rules (see `firestore.rules` and `storage.rules`)

## Development

```bash
npm install
npm run dev
```

## Deployment

The application can be deployed to any static hosting platform:

- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag & drop or Git integration  
- **Firebase Hosting**: `firebase deploy`
- **GitHub Pages**: Static build deployment

Environment variables should be configured through your hosting platform's settings.

## License

MIT License - see LICENSE file for details.