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

The application will be refactored into a more modular, multi-source architecture:

- **Entry Point**: `index.jsx` - Main application entry point and top-level state management.
- **Components**: Modular React components in `/components/` directory:
  - `Tabs.jsx` - Displays and manages the different data source tabs.
  - `Story.jsx` - Individual story display component.
  - `StoryList.jsx` - List container for stories.
  - `StoryModal.jsx` - Modal for story actions (comments/article links).
  - `SearchBox.jsx` - Search input component.
  - `HelpMenu.jsx` - Help/controls display component.
- **Data Sources**: Logic for fetching and parsing data from different sources will be in the `/src/sources/` directory.
  - `hackernews.js`
  - `simonwillison.js`
- **State Management**: Uses React hooks. State will be managed on a per-tab basis, with a top-level state for the active tab and the collection of all tabs.
- **Story Data**: Fetches from multiple sources:
    - Hacker News Firebase API (`https://hacker-news.firebaseio.com/v0/`)
    - Simon Willison's Atom Feed (`https://simonwillison.net/atom/everything/`)
- **Persistent Storage**: Saves removed article IDs to source-specific files (e.g., `.removed-articles.json`, `.removed-articles-sw.json`).

### Key Features

1.  **Tabbed Interface**: Each data source is presented in its own tab.
2.  **Story Filtering**:
    - For Hacker News, only shows stories with 50+ comments and filters out deleted/dead stories.
    - Persistent removal of articles on a per-source basis (stored locally).
3.  **Sorting**: For Hacker News, two modes - by comment count (default) or by date. Simon Willison feed is sorted by date.
4.  **Search**: Real-time search across title, author, and URL within the active tab.
5.  **UI Navigation**: Vim-like keybindings (j/k, gg, G) plus arrow keys for story navigation. `h`/`l` and arrow keys for tab switching.
6.  **External Links**: Modal for choosing between HN comments or original article URL. For other sources, opens the article URL directly.

### Data Flow

1.  On startup, the app initializes tabs for each configured data source.
2.  For the active tab, it fetches data from the corresponding source (or loads from cache).
3.  It removes any articles the user has previously hidden (from the source-specific local storage).
4.  Data is parsed into a standardized story format.
5.  Stories are sorted and displayed in a paginated view.

### Key State Variables

- `tabs`: An array of tab objects, where each object holds the state for a data source (e.g., `id`, `title`, `stories`, `selectedIndex`, `scrollOffset`).
- `activeTabId`: The ID of the currently active tab.
- `filteredStories`: This will be derived from the active tab's stories.
- `searchMode`/`searchQuery`: Search functionality state, applied to the active tab.
- `modalOpen`/`selectedStory`: Story action modal state.

### File System Usage

- `.removed-articles.json`: Stores IDs of Hacker News articles the user has removed.
- `.removed-articles-sw.json`: Stores IDs of Simon Willison articles the user has removed.
- Caching for feeds like Simon Willison's will also be stored on the file system.

## Dependencies

- **Runtime**: Bun (JavaScript runtime)
- **UI Framework**: React 19.1.1 with Ink 6.3.1 for terminal rendering
- **External Tools**: `open` package for launching URLs in browser.
- **Parsing**: An XML parser like `fast-xml-parser` will be added for Atom feeds.