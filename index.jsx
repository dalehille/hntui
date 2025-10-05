#!/usr/bin/env node

import React, { useState, useEffect, useContext, createContext } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StoryList from './components/StoryList.jsx';
import SearchBox from './components/SearchBox.jsx';
import HelpMenu from './components/HelpMenu.jsx';
import Tabs from './components/Tabs.jsx';
import * as HackerNews from './sources/hackernews.js';
import * as SimonWillison from './sources/simonwillison.js';

export const ThemeContext = createContext(null);

/**
 * Create a new tab structure
 */
const createTab = (sourceId, sourceName, sourceFetcher) => {
  return {
    id: sourceId,
    title: sourceName,
    stories: [],
    filteredStories: [],
    selectedIndex: 0,
    scrollOffset: 0,
    loading: true,
    error: null,
    searchMode: false,
    searchQuery: '',
    sortByComments: true,
    sortDateAscending: false, // false = newest first (descending), true = oldest first (ascending)
    removedStoryIds: new Set(),
    sourceFetcher,
  };
};

function App() {
  const [tabs, setTabs] = useState(() => {
    const hnTab = createTab('hackernews', 'Hacker News', HackerNews.fetchStories);
    const swTab = createTab('simonwillison', 'Simon Willison', SimonWillison.fetchStories);
    // Simon Willison tab should default to sorting by date (not comments)
    swTab.sortByComments = false;
    return [hnTab, swTab];
  });
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [gKeySequence, setGKeySequence] = useState('');

  const { colors } = useContext(ThemeContext);
  const { exit } = useApp();

  const STORIES_PER_PAGE = 15;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Get current active tab
  const activeTab = tabs[activeTabIndex];

  // Get removed articles path for a specific tab
  const getRemovedArticlesPath = (tabId) => {
    return path.join(__dirname, `.removed-articles-${tabId}.json`);
  };

  // Sort stories based on sort mode
  const sortStories = (stories, sortByCommentsMode, sortDateAscendingMode = false) => {
    return [...stories].sort((a, b) => {
      if (sortByCommentsMode) {
        // Sort by comment count (descending)
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      } else {
        // Sort by date
        if (sortDateAscendingMode) {
          // Ascending - oldest first
          return (a.date || 0) - (b.date || 0);
        } else {
          // Descending - newest first
          return (b.date || 0) - (a.date || 0);
        }
      }
    });
  };

  // Get display text for current sort mode
  const getSortDisplayText = (tab) => {
    if (tab.id === 'simonwillison') {
      // Simon Willison only has date sorting
      return tab.sortDateAscending ? 'Date (Oldest First)' : 'Date (Newest First)';
    } else {
      // Other tabs (like Hacker News) can sort by comments or date
      if (tab.sortByComments) {
        return 'Comments';
      } else {
        return 'Date (Newest First)';
      }
    }
  };

  // Update a specific tab
  const updateTab = (tabIndex, updates) => {
    setTabs(prevTabs => {
      const newTabs = [...prevTabs];
      newTabs[tabIndex] = { ...newTabs[tabIndex], ...updates };
      return newTabs;
    });
  };

  // Load removed article IDs from disk for a specific tab
  const loadRemovedArticles = (tabId) => {
    try {
      const removedArticlesPath = getRemovedArticlesPath(tabId);
      if (fs.existsSync(removedArticlesPath)) {
        const data = fs.readFileSync(removedArticlesPath, 'utf8');
        const removedIds = JSON.parse(data);
        return new Set(removedIds);
      }
      return new Set();
    } catch (error) {
      console.error('Error loading removed articles:', error);
      return new Set();
    }
  };

  // Save removed article IDs to disk for a specific tab
  const saveRemovedArticles = (tabId, removedIds) => {
    try {
      const removedArticlesPath = getRemovedArticlesPath(tabId);
      const data = JSON.stringify(Array.from(removedIds));
      fs.writeFileSync(removedArticlesPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving removed articles:', error);
    }
  };

  // Remove an article from the list
  const removeArticle = (storyId) => {
    const tab = activeTab;
    const newRemovedIds = new Set(tab.removedStoryIds);
    newRemovedIds.add(storyId);
    saveRemovedArticles(tab.id, newRemovedIds);

    // Update the main stories list to remove the article
    const updatedStories = tab.stories.filter(story => story.id !== storyId);

    let updates = {
      stories: updatedStories,
      removedStoryIds: newRemovedIds,
    };

    // If we're in search mode, re-apply the search filter
    if (tab.searchMode) {
      const reFiltered = updatedStories.filter(story =>
        story.title.toLowerCase().includes(tab.searchQuery.toLowerCase()) ||
        (story.author && story.author.toLowerCase().includes(tab.searchQuery.toLowerCase())) ||
        (story.url && story.url.toLowerCase().includes(tab.searchQuery.toLowerCase()))
      );

      // If the filtered list becomes empty after re-filtering, exit search mode
      if (reFiltered.length === 0) {
        updates = {
          ...updates,
          searchMode: false,
          searchQuery: '',
          filteredStories: [...updatedStories],
          selectedIndex: 0,
          scrollOffset: 0,
        };
      } else {
        updates = {
          ...updates,
          filteredStories: reFiltered,
          selectedIndex: tab.selectedIndex >= reFiltered.length
            ? Math.max(0, reFiltered.length - 1)
            : tab.selectedIndex,
        };
      }
    } else {
      // Not in search mode, just update filtered stories
      updates = {
        ...updates,
        filteredStories: updatedStories,
        selectedIndex: tab.selectedIndex >= updatedStories.length
          ? Math.max(0, updatedStories.length - 1)
          : tab.selectedIndex,
      };
    }

    updateTab(activeTabIndex, updates);
  };

  // Fetch data for a specific tab
  const fetchDataForTab = async (tabIndex) => {
    const tab = tabs[tabIndex];
    try {
      updateTab(tabIndex, { loading: true, error: null });

      // Load removed articles for this tab
      const removedIds = loadRemovedArticles(tab.id);

      // Fetch stories from the source
      const fetchedStories = await tab.sourceFetcher(removedIds);

      // Sort stories
      const sortedStories = sortStories(fetchedStories, tab.sortByComments, tab.sortDateAscending);

      updateTab(tabIndex, {
        stories: sortedStories,
        filteredStories: sortedStories,
        removedStoryIds: removedIds,
        loading: false,
      });
    } catch (err) {
      updateTab(tabIndex, {
        error: err.message,
        loading: false,
      });
    }
  };

  useEffect(() => {
    // Clear the terminal screen on initial mount
    process.stdout.write('\x1b[2J\x1b[H');

    // Initialize all tabs
    tabs.forEach((_, index) => {
      fetchDataForTab(index);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter stories for the active tab
  const filterStories = (query) => {
    const tab = activeTab;
    if (!query.trim()) {
      updateTab(activeTabIndex, {
        filteredStories: sortStories(tab.stories, tab.sortByComments, tab.sortDateAscending),
      });
      return;
    }

    const filtered = tab.stories.filter(story =>
      story.title.toLowerCase().includes(query.toLowerCase()) ||
      (story.author && story.author.toLowerCase().includes(query.toLowerCase())) ||
      (story.url && story.url.toLowerCase().includes(query.toLowerCase()))
    );
    updateTab(activeTabIndex, {
      filteredStories: sortStories(filtered, tab.sortByComments, tab.sortDateAscending),
    });
  };

  // Update scroll position and selection for the active tab
  const updateScrollAndSelection = (newSelectedIndex) => {
    const tab = activeTab;
    const maxIndex = tab.filteredStories.length - 1;
    const clampedIndex = Math.max(0, Math.min(newSelectedIndex, maxIndex));

    let newScrollOffset = tab.scrollOffset;
    if (clampedIndex < tab.scrollOffset) {
      newScrollOffset = clampedIndex;
    } else if (clampedIndex >= tab.scrollOffset + STORIES_PER_PAGE) {
      newScrollOffset = clampedIndex - STORIES_PER_PAGE + 1;
    }

    updateTab(activeTabIndex, {
      scrollOffset: newScrollOffset,
      selectedIndex: clampedIndex,
    });
  };

  useInput((input, key) => {
    const tab = activeTab;

    if (tab.searchMode) {
      // Search mode - handle search input
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (key.escape) {
        // Exit search mode and clear filter
        updateTab(activeTabIndex, {
          searchMode: false,
          searchQuery: '',
          filteredStories: [...tab.stories],
          selectedIndex: 0,
          scrollOffset: 0,
        });
      } else if (key.return) {
        // Exit search mode but keep filter
        updateTab(activeTabIndex, {
          searchMode: false,
          selectedIndex: 0,
          scrollOffset: 0,
        });
      } else if (key.backspace || key.delete) {
        // Handle backspace and filter in real-time
        const newQuery = tab.searchQuery.slice(0, -1);
        updateTab(activeTabIndex, { searchQuery: newQuery });
        filterStories(newQuery);
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        // Add character to search query and filter in real-time
        const newQuery = tab.searchQuery + input;
        updateTab(activeTabIndex, { searchQuery: newQuery });
        filterStories(newQuery);
      }
    } else if (helpOpen) {
      // Help menu is open - handle help menu navigation
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (key.escape) {
        setHelpOpen(false);
      }
    } else {
      // Main navigation
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if ((input === 'h' || key.leftArrow) && tabs.length > 1) {
        // Switch to previous tab
        const newIndex = activeTabIndex === 0 ? tabs.length - 1 : activeTabIndex - 1;
        setActiveTabIndex(newIndex);
        setGKeySequence('');
      } else if ((input === 'l' || key.rightArrow) && tabs.length > 1) {
        // Switch to next tab
        const newIndex = activeTabIndex === tabs.length - 1 ? 0 : activeTabIndex + 1;
        setActiveTabIndex(newIndex);
        setGKeySequence('');
      } else if (key.tab && tabs.length > 1) {
        // Tab key - switch to next tab
        const newIndex = activeTabIndex === tabs.length - 1 ? 0 : activeTabIndex + 1;
        setActiveTabIndex(newIndex);
        setGKeySequence('');
      } else if (input === 'r') {
        // Refresh stories for current tab
        fetchDataForTab(activeTabIndex);
        updateTab(activeTabIndex, {
          selectedIndex: 0,
          scrollOffset: 0,
        });
      } else if (input === 's') {
        // Toggle sort - behavior depends on the tab
        if (tab.id === 'simonwillison') {
          // For Simon Willison tab, only toggle date sort direction
          const newSortDateAscending = !tab.sortDateAscending;
          const sortedStories = sortStories(tab.stories, false, newSortDateAscending);
          const sortedFiltered = sortStories(tab.filteredStories, false, newSortDateAscending);
          updateTab(activeTabIndex, {
            sortDateAscending: newSortDateAscending,
            stories: sortedStories,
            filteredStories: sortedFiltered,
            selectedIndex: 0,
            scrollOffset: 0,
          });
        } else {
          // For other tabs (like Hacker News), toggle between comments and date
          const newSortByComments = !tab.sortByComments;
          const sortedStories = sortStories(tab.stories, newSortByComments, tab.sortDateAscending);
          const sortedFiltered = sortStories(tab.filteredStories, newSortByComments, tab.sortDateAscending);
          updateTab(activeTabIndex, {
            sortByComments: newSortByComments,
            stories: sortedStories,
            filteredStories: sortedFiltered,
            selectedIndex: 0,
            scrollOffset: 0,
          });
        }
        setGKeySequence('');
      } else if (input === '/') {
        // Enter search mode
        updateTab(activeTabIndex, {
          searchMode: true,
          searchQuery: '',
        });
        setGKeySequence('');
      } else if (input === '?') {
        // Open help menu
        setHelpOpen(true);
        setGKeySequence('');
      } else if (input === 'g') {
        // Handle 'g' key sequence for 'gg' (go to top)
        if (gKeySequence === 'g') {
          // 'gg' - go to top
          updateScrollAndSelection(0);
          setGKeySequence('');
        } else {
          setGKeySequence('g');
          // Reset sequence after a short delay
          setTimeout(() => setGKeySequence(''), 500);
        }
      } else if (input === 'G' || (key.shift && input === 'g')) {
        // 'G' or 'Shift+G' - go to bottom
        updateScrollAndSelection(tab.filteredStories.length - 1);
        setGKeySequence('');
      } else if (key.upArrow || input === 'k') {
        updateScrollAndSelection(tab.selectedIndex - 1);
        setGKeySequence('');
      } else if (key.downArrow || input === 'j') {
        updateScrollAndSelection(tab.selectedIndex + 1);
        setGKeySequence('');
      } else if (input === 'd' && tab.filteredStories[tab.selectedIndex]) {
        // Remove current article directly with 'd' key
        const story = tab.filteredStories[tab.selectedIndex];
        removeArticle(story.id);
        setGKeySequence('');
      } else if ((key.return || input === ' ') && tab.filteredStories[tab.selectedIndex]) {
        // Open the appropriate URL: HN comments page, or article URL for other sources
        const story = tab.filteredStories[tab.selectedIndex];
        const urlToOpen = story.source === 'hackernews' ? story.commentsUrl : story.url;
        try {
          if (urlToOpen) {
            open(urlToOpen);
          }
        } catch (error) {
          console.log(`\nError opening URL: ${error.message}`);
        }
        setGKeySequence('');
      } else {
        // Reset 'g' sequence for any other key
        setGKeySequence('');
      }
    }
  });


  if (activeTab.loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.primary} bold>{activeTab.title}</Text>
        <Text>Loading stories sorted by {getSortDisplayText(activeTab)}...</Text>
      </Box>
    );
  }

  if (activeTab.error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.error} bold>Error loading stories:</Text>
        <Text>{activeTab.error}</Text>
        <Text dimColor={colors.dim}>Press 'q' to quit</Text>
      </Box>
    );
  }

  return (
    <Box width="100%" height="100%">
      <Box flexDirection="column" padding={1}>
        {tabs.length > 1 && (
          <Tabs tabs={tabs} activeTabIndex={activeTabIndex} />
        )}

        <Box marginBottom={1}>
          <Text color={colors.primary} bold>
            {activeTab.title} - Sorted by {getSortDisplayText(activeTab)}
          </Text>
        </Box>

        {activeTab.searchMode && <SearchBox searchQuery={activeTab.searchQuery} />}

        <StoryList
          stories={activeTab.filteredStories}
          selectedIndex={activeTab.selectedIndex}
          scrollOffset={activeTab.scrollOffset}
          storiesPerPage={STORIES_PER_PAGE}
        />

        {activeTab.filteredStories.length !== activeTab.stories.length && (
          <Box marginTop={1}>
            <Text dimColor={colors.dim}>Filtered from {activeTab.stories.length} total</Text>
          </Box>
        )}

        {helpOpen && <HelpMenu />}
      </Box>
    </Box>
  );
}

function ThemeProvider({ children }) {
  const themes = {
    dark: {
      foreground: 'white',
      background: 'black',
      primary: 'cyan',
      secondary: 'yellow',
      accent: 'blue',
      dim: 'gray',
      error: 'red',
    },
    light: {
      foreground: 'black',
      background: 'white',
      primary: 'blue',
      secondary: 'darkYellow',
      accent: 'lightBlue',
      dim: 'lightGray',
      error: 'red',
    },
  };
  const [themeName, setThemeName] = useState('dark');
  const theme = themes[themeName];

  useInput((input, key) => {
    if (input === 't') {
      setThemeName(currentThemeName => (currentThemeName === 'dark' ? 'light' : 'dark'));
    }
  });

  const themeApi = {
    theme,
    setTheme: setThemeName,
    colors: theme,
  };

  return (
    <ThemeContext.Provider value={themeApi}>
      {children}
    </ThemeContext.Provider>
  );
}

render(<ThemeProvider><App /></ThemeProvider>);

export default App;
