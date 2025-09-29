# Hacker News TUI

A terminal-based Hacker News reader built with React, Ink, Cursor/Gemini/Claude.

## Features

- Browse top Hacker News stories in your terminal
- Search and filter stories
- Sort by comments or date
- Open stories in browser
- Remove stories from your view
- Real-time navigation with keyboard shortcuts

## Installation

```bash
npm install
```

## Usage

### Development Mode (with sample data and auto-restart)
```bash
npm run dev
```

This will:
- Load sample data from `sample-data.json` instead of making API calls to Hacker News
- Automatically restart the app when you make changes to any file
- Perfect for development and testing without hitting rate limits

### Production Mode (with real API calls)
```bash
npm start
```

This will fetch real data from the Hacker News API.

## Keyboard Shortcuts

- `↑/↓` or `j/k` - Navigate stories
- `gg` - Go to top
- `G` - Go to bottom
- `/` - Search mode
- `Enter` - Open story modal
- `v` - Open story drawer
- `d` - Remove current story
- `r` - Refresh stories
- `s` - Toggle sort (comments/date)
- `q` - Quit

## Development

The app includes sample data for faster development iteration. When running `npm run dev`, the app will:

- Use sample data from `sample-data.json` instead of making API calls to Hacker News
- Automatically restart when you save changes to any file (thanks to Bun's `--watch` flag)
- Provide instant feedback as you develop

### Development Workflow

1. Start the dev server: `npm run dev`
2. Make changes to any file (components, main app, etc.)
3. The app automatically restarts with your changes
4. No need to manually restart or refresh

### Updating Sample Data

To update the sample data, edit the `sample-data.json` file with realistic Hacker News story data. The app will automatically restart when you save the file.
