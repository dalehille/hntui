# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HNTUI is a terminal-based Hacker News reader built with React using Ink for terminal UI rendering. It fetches and displays the top Hacker News stories with an interactive TUI interface.

## Commands

- `bun start` or `bun index.jsx` - Start the application
- No specific test command configured (shows error message)

## Architecture

### Main Application Structure

The entire application is contained in a single file (`index.jsx`) with the following key components:

- **State Management**: Uses React hooks for all state (stories, filtering, UI state, modal state)
- **Story Data**: Fetches from Hacker News Firebase API (`https://hacker-news.firebaseio.com/v0/`)
- **Persistent Storage**: Saves removed article IDs to `.removed-articles.json` file

### Key Features

1. **Story Filtering**:
   - Only shows stories with 50+ comments
   - Filters out deleted/dead stories
   - Persistent removal of articles (stored locally)

2. **Sorting**: Two modes - by comment count (default) or by date

3. **Search**: Real-time search across title, author, and URL

4. **UI Navigation**: Vim-like keybindings (j/k, gg, G) plus arrow keys

5. **External Links**: Modal for choosing between HN comments or original article URL

### Data Flow

1. Fetches top story IDs from HN API
2. Fetches individual story details (first 300 stories)
3. Filters valid stories (50+ comments, not deleted/dead)
4. Removes previously hidden articles from local storage
5. Sorts and displays in paginated view (15 stories per page)

### Key State Variables

- `stories`: Main story data array
- `filteredStories`: Currently displayed stories (after search/filter)
- `removedStoryIds`: Set of removed article IDs (persisted to disk)
- `selectedIndex`/`scrollOffset`: Current selection and viewport
- `searchMode`/`searchQuery`: Search functionality state
- `modalOpen`/`selectedStory`: Story action modal state

### File System Usage

- `.removed-articles.json`: Stores IDs of articles the user has removed from their view

## Dependencies

- **Runtime**: Bun (JavaScript runtime)
- **UI Framework**: React 19.1.1 with Ink 6.3.1 for terminal rendering
- **External Tools**: `open` package for launching URLs in browser