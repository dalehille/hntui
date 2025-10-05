# Implementation Plan: Multi-Source TUI

This document outlines the plan to refactor the Hacker News TUI to support multiple data sources in a tabbed interface.

## Phase 1: Code Refactoring and Abstraction ✅ COMPLETED

The first phase will focus on restructuring the existing code to make it more modular and extensible. This will lay the foundation for adding new data sources and features.

### 1.1. Create a Directory for Data Sources ✅

We'll organize data-source-specific logic into its own directory.

- ✅ Create a new directory: `sources/` (in root, not `src/sources`).
- ✅ Move Hacker News related logic into `sources/hackernews.js`. This file exports functions for fetching and processing Hacker News stories.
- Create a similar file for the new data source: `sources/simonwillison.js` (Phase 3).

### 1.2. Refactor State Management ✅

The main `App` component currently holds all the state. We need to refactor this to manage state on a per-tab basis.

- ✅ Define a `tab` data structure that holds the state for each tab (e.g., `id`, `title`, `stories`, `selectedIndex`, `scrollOffset`, `searchMode`, `searchQuery`, `sortByComments`, `removedStoryIds`, etc.).
- ✅ The main `App` component now manages an array of these `tab` objects and the index of the currently active tab.
- ✅ Each tab maintains its own state independently.

### 1.3. Abstract Data Fetching ✅

Create a generic data fetching mechanism that can be used by any data source.

- ✅ In `App`, created a function `fetchDataForTab(tabIndex)` that delegates to the appropriate data source module.
- ✅ Each data source module (e.g., `hackernews.js`) exposes a `fetchStories()` function that returns a standardized story format.
- ✅ Each tab stores a reference to its `sourceFetcher` function.

### 1.4. Standardize Story Format ✅

To allow components like `StoryList` to be reused, we need a consistent data format for stories from all sources.

- ✅ Defined a standard story object format: `{ id, title, url, source, score, author, commentsUrl, commentsCount, date, metadata }`.
- ✅ Each data source module is responsible for mapping its data to this standard format.
- ✅ Updated `Story` component to use the standardized fields (`author` instead of `by`, `commentsCount` instead of `descendants`, `date` instead of `time`).
- ✅ Updated `StoryModal` to use generic "Open comments" instead of "Open Hacker News comments".
- ✅ Each source has its own removed articles file (e.g., `.removed-articles-hackernews.json`).

## Phase 2: Tabbed Interface ✅ COMPLETED

With the refactoring complete, we can now build the tabbed UI.

### 2.1. Create a `Tabs` Component ✅

- ✅ Created new component `components/Tabs.jsx`.
- ✅ Displays the list of available tabs with rounded borders.
- ✅ Highlights the active tab with primary color and bold text.
- ✅ Shows inactive tabs with dimmed color.
- ✅ Includes helpful hint text "Use h/l or ←/→ to switch tabs".
- ✅ Only renders when there are multiple tabs (tabs.length > 1).

### 2.2. Implement Tab Switching Logic ✅

- ✅ Modified the `useInput` hook to handle tab switching.
- ✅ Implemented keybindings: `h` (previous tab), `l` (next tab).
- ✅ Implemented arrow key support: `←` (previous), `→` (next).
- ✅ Tab switching wraps around (last → first, first → last).
- ✅ Only active when there are multiple tabs.
- ✅ When tab changes, the `StoryList` re-renders with the active tab's state.
- ✅ Each tab maintains its own independent state (selection, scroll, search, etc.).
- ✅ Updated `HelpMenu.jsx` to document the new tab switching keys.
- ✅ Added temporary second test tab for demonstration.

## Phase 3: Add Simon Willison Feed ✅ COMPLETED

Now we'll add the new data source.

### 3.1. Implement Atom Feed Fetching and Parsing ✅

- ✅ Created `sources/simonwillison.js` with logic to fetch the Atom feed from `https://simonwillison.net/atom/everything/`.
- ✅ Added `fast-xml-parser` (v4.5.3) to `package.json` dependencies.
- ✅ Implemented XML parsing using `XMLParser` from fast-xml-parser.
- ✅ Handles both singular and array entries from the Atom feed.
- ✅ Extracts title, URL, author, date, and summary from each entry.
- ✅ Maps Atom entries to the standardized story format.

### 3.2. Implement Caching ✅

- ✅ Implemented disk caching to `.cache-simonwillison.json`.
- ✅ Cache has a 1-hour maximum age (configurable via `CACHE_MAX_AGE_MS`).
- ✅ Checks cache freshness before fetching from the network.
- ✅ Automatically refreshes cache when it's older than the threshold.
- ✅ Falls back to fresh fetch if cache is invalid or missing.
- ✅ Saves fetched data to cache for future use.

### 3.3. Implement Story Removal ✅

- ✅ Story removal already works via the tab-based architecture from Phase 1.
- ✅ Each source has its own removed articles file: `.removed-articles-simonwillison.json`.
- ✅ The existing `removeArticle` logic in `App.js` handles removing articles for the currently active tab.
- ✅ Removed articles are filtered out when fetching stories.

### 3.4. Update UI for the New Feed ✅

- ✅ Updated `Story.jsx` component to conditionally display:
  - Score only if > 0 (blog posts don't have scores)
  - Comment count only if > 0 (blog posts may not have comments)
  - Uses bullet points (•) for cleaner separation
- ✅ `StoryModal` already works generically (uses "Open comments" not "Open HN comments").
- ✅ Blog posts are sorted by date (most recent first) by default.
- ✅ All features (search, sort, remove) work with blog posts.

### 3.5. Create Sample Data ✅

- ✅ Created `simonwillison-sample-data.json` with 20 realistic blog post entries.
- ✅ Sample data uses the standardized story format.
- ✅ Includes realistic titles, URLs, dates, and metadata.
- ✅ Data fetching automatically uses sample data when `NODE_ENV=development`.
- ✅ Perfect for development without hitting the real API.

### 3.6. Additional Improvements ✅

- ✅ Updated `.gitignore` to exclude cache files and removed articles for all sources.
- ✅ Replaced test tab with real Simon Willison tab.
- ✅ Both tabs load independently with their own data sources.
- ✅ Each tab maintains separate state and removed articles list.

## Phase 4: Final Touches and Cleanup

### 4.1. Update Help Menu

- Add information about the new keybindings for tab switching to the `HelpMenu` component.
- Add information about the new data source.

### 4.2. Update Documentation

- Update `CLAUDE.md` to reflect the new architecture, data sources, and tabbed interface.

### 4.3. Code Cleanup

- Review the code for any remaining hardcoded values related to Hacker News.
- Ensure all components are using the new abstracted state and data fetching logic.
- Add comments where necessary to explain the new architecture.

This plan provides a structured approach to implementing the requested features. We can start with Phase 1 to build a solid foundation. Let me know if you have any questions!
