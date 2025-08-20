import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    app: 'FinBuddy',
    version: '1.0.0'
  });
});

// For any other route, serve index.html (React Router will handle it)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`FinBuddy server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`App: http://localhost:${port}`);
});
