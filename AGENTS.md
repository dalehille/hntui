# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HNTUI is a terminal-based content reader built with React using Ink for terminal UI rendering. It fetches and displays stories from multiple sources, starting with Hacker News and Simon Willison's blog, in an interactive, tabbed TUI interface.

## Commands

- `bun start` or `bun index.jsx` - Start the application
- `bun dev` - Start the application in development mode with hot-reloading.
- No specific test command configured (shows error message)

## Architecture

### Main Application Structure

The application uses a modular, multi-source architecture:

- **Entry Point**: `index.jsx` - Main application entry point and top-level state management.
- **Components**: Modular React components in `/components/` directory:
  - `Tabs.jsx` - Displays and manages the different data source tabs.
  - `Story.jsx` - Individual story display component.
  - `StoryList.jsx` - List container for stories.
  - `StoryModal.jsx` - Source-aware modal for story actions (opens comments/article links or removes from list).
  - `SearchBox.jsx` - Search input component.
  - `HelpMenu.jsx` - Help/controls display component.
- **Data Sources**: Logic for fetching and parsing data from different sources in the `/sources/` directory:
  - `hackernews.js` - Fetches and parses HN stories, includes retry logic and batch fetching.
  - `simonwillison.js` - Fetches and parses Atom feed with caching.
- **State Management**: Uses React hooks. Each tab maintains its own complete state (stories, selection, scroll position, search query, sort preference, removed articles).
- **Story Data**: Fetches from multiple sources:
    - Hacker News Firebase API (`https://hacker-news.firebaseio.com/v0/`)
    - Simon Willison's Atom Feed (`https://simonwillison.net/atom/everything/`)
- **Persistent Storage**: 
  - Removed article IDs saved to source-specific files (`.removed-articles-hackernews.json`, `.removed-articles-simonwillison.json`)
  - Feed cache files for performance (`.cache-simonwillison.json` with 1-hour expiry)

### Key Features

1.  **Tabbed Interface**: Each data source is presented in its own tab with independent state.
2.  **Story Filtering**:
    - For Hacker News, only shows stories with 50+ comments and filters out deleted/dead stories.
    - Persistent removal of articles on a per-source basis (stored locally).
3.  **Sorting**: Each tab can toggle between sorting by comment count or by date (default varies by source).
4.  **Search**: Real-time search across title, author, and URL within the active tab.
5.  **UI Navigation**: 
    - Story navigation: Vim-like keybindings (`j`/`k`, `gg`, `G`) plus arrow keys
    - Tab switching: `h`/`l` or arrow keys (left/right)
    - Quick access: Spacebar opens comments/article directly
6.  **Source-Aware Modal**: 
    - HN stories: 3 options (open comments, open article, remove)
    - Blog posts: 2 options (open article, remove)
    - Modal adapts based on content type

### Data Flow

1.  On startup, the app initializes all tabs for each configured data source.
2.  Each tab fetches data from its source (or loads from cache/sample data in dev mode).
3.  Removed articles are filtered out using the source-specific removed IDs list.
4.  Data is parsed into a standardized story format.
5.  Stories are sorted and displayed in a paginated view.
6.  Tab switching preserves each tab's complete state.

### Standardized Story Format

All sources map their data to this format:
```javascript
{
  id: string | number,        // Unique identifier
  title: string,              // Story title
  url: string | null,         // External URL
  source: string,             // Source identifier ('hackernews', 'simonwillison')
  score: number,              // Points/score (0 for sources without scores)
  author: string,             // Author name
  commentsUrl: string,        // URL to comments (or article for blogs)
  commentsCount: number,      // Number of comments (0 if unavailable)
  date: number,               // Unix timestamp
  metadata: object            // Source-specific extra data
}
```

### Key State Variables

- `tabs`: Array of tab objects, each containing:
  - `id`, `title`, `stories`, `filteredStories`
  - `selectedIndex`, `scrollOffset`
  - `searchMode`, `searchQuery`
  - `sortByComments`, `removedStoryIds`
  - `loading`, `error`
  - `sourceFetcher` (function reference)
- `activeTabIndex`: Index of the currently active tab
- `modalOpen`: Whether the story action modal is displayed
- `selectedStory`: Currently selected story for modal actions
- `helpOpen`: Whether the help menu is displayed

### File System Usage

- `.removed-articles-hackernews.json`: Stores IDs of HN stories the user has removed
- `.removed-articles-simonwillison.json`: Stores IDs of blog posts the user has removed
- `.cache-simonwillison.json`: Caches parsed Atom feed data (1-hour expiry)
- `sample-data.json`: Sample HN data for development mode
- `simonwillison-sample-data.json`: Sample blog data for development mode

All cache and removed articles files are git-ignored (`.gitignore` patterns: `.removed-articles*`, `.cache-*.json`).

## Dependencies

- **Runtime**: Bun (JavaScript runtime)
- **UI Framework**: React 19.1.1 with Ink 6.3.1 for terminal rendering
- **External Tools**: `open` package (v10.1.0) for launching URLs in browser
- **Parsing**: `fast-xml-parser` (v4.5.3) for parsing Atom XML feeds

## Development Mode

Set `NODE_ENV=development` to use sample data instead of fetching from APIs:
- Faster iteration
- No API rate limits
- Consistent test data
- Auto-reload with `bun dev --watch`

## Adding New Sources

To add a new data source:

1. **Create source module** in `/sources/newsource.js`:
   ```javascript
   export const fetchStories = async (removedIds = new Set()) => {
     // Fetch and parse data
     // Map to standardized format
     // Filter out removed IDs
     // Return array of story objects
   };
   
   export const getSourceInfo = () => ({
     id: 'newsource',
     name: 'New Source',
     supportsComments: true/false,
     supportsScores: true/false,
   });
   ```

2. **Create sample data** in `/newsource-sample-data.json` with the standardized format

3. **Import and add tab** in `index.jsx`:
   ```javascript
   import * as NewSource from './sources/newsource.js';
   
   // In App component:
   const [tabs, setTabs] = useState([
     createTab('hackernews', 'Hacker News', HackerNews.fetchStories),
     createTab('simonwillison', 'Simon Willison', SimonWillison.fetchStories),
     createTab('newsource', 'New Source', NewSource.fetchStories),
   ]);
   ```

The UI, modal, navigation, and all features will work automatically!