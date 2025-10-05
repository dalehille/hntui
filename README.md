# HNTUI

A terminal-based content reader built with React and Ink. Browse stories from multiple sources including Hacker News and Simon Willison's blog in a unified, tabbed interface.

## Features

- **Multi-source content**: Browse stories from Hacker News and Simon Willison's blog
- **Tabbed interface**: Switch between different content sources
- **Search and filter**: Find stories across all sources
- **Flexible sorting**: Sort by comments or date (per source)
- **Quick access**: Open stories and comments in your browser
- **Persistent filtering**: Remove stories from your view
- **Real-time navigation**: Vim-like keyboard shortcuts

## Installation

```bash
npm install
```

## Usage

### Production Mode (with real API calls)
```bash
npm start
```

This will fetch real data from all configured sources (Hacker News and Simon Willison's blog).


### Development Mode (with sample data and auto-restart)
```bash
npm run dev
```

This will:
- Load sample data from `sample-data.json` and `simonwillison-sample-data.json` instead of making API calls
- Automatically restart the app when you make changes to any file
- Perfect for development and testing without hitting rate limits


## Keyboard Shortcuts

- `↑/↓` or `j/k` - Navigate stories
- `←/→` or `h/l` - Switch between tabs
- `gg` - Go to top
- `G` - Go to bottom
- `/` - Search mode
- `Enter` or `Space` - Open story/comments in browser
- `d` - Remove current story
- `r` - Refresh stories
- `s` - Toggle sort (comments/date)
- `?` - Show help
- `q` - Quit

## Development

The app includes sample data for faster development iteration. When running `npm run dev`, the app will:

- Use sample data from `sample-data.json` and `simonwillison-sample-data.json` instead of making API calls
- Automatically restart when you save changes to any file (thanks to Bun's `--watch` flag)
- Provide instant feedback as you develop

### Development Workflow

1. Start the dev server: `npm run dev`
2. Make changes to any file (components, main app, etc.)
3. The app automatically restarts with your changes
4. No need to manually restart or refresh

### Updating Sample Data

To update the sample data, edit the respective JSON files:
- `sample-data.json` - Hacker News stories
- `simonwillison-sample-data.json` - Simon Willison blog posts

The app will automatically restart when you save any file.
