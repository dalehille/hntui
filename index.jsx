#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StoryList from './components/StoryList.jsx';
import SearchBox from './components/SearchBox.jsx';
import StoryModal from './components/StoryModal.jsx';
import StoryDrawer from './components/StoryDrawer.jsx';

const HackerNewsTUI = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [modalSelectedOption, setModalSelectedOption] = useState(0);
  const [drawerSelectedOption, setDrawerSelectedOption] = useState(0);
  const [gKeySequence, setGKeySequence] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStories, setFilteredStories] = useState([]);
  const [removedStoryIds, setRemovedStoryIds] = useState(new Set());
  const [sortByComments, setSortByComments] = useState(true);
  const { exit } = useApp();

  const STORIES_PER_PAGE = 15;
  const MAX_STORIES = 300;

  // Get the path to the removed articles file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const removedArticlesPath = path.join(__dirname, '.removed-articles.json');

  // Sort stories based on current sort mode
  const sortStories = (stories, sortByCommentsMode = sortByComments) => {
    return [...stories].sort((a, b) => {
      if (sortByCommentsMode) {
        // Sort by comment count (descending)
        return (b.descendants || 0) - (a.descendants || 0);
      } else {
        // Sort by date (descending - newest first)
        return (b.time || 0) - (a.time || 0);
      }
    });
  };

  // Load removed article IDs from disk
  const loadRemovedArticles = () => {
    try {
      if (fs.existsSync(removedArticlesPath)) {
        const data = fs.readFileSync(removedArticlesPath, 'utf8');
        const removedIds = JSON.parse(data);
        setRemovedStoryIds(new Set(removedIds));
        return new Set(removedIds);
      }
      return new Set();
    } catch (error) {
      console.error('Error loading removed articles:', error);
      return new Set();
    }
  };

  // Save removed article IDs to disk
  const saveRemovedArticles = (removedIds) => {
    try {
      const data = JSON.stringify(Array.from(removedIds));
      fs.writeFileSync(removedArticlesPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving removed articles:', error);
    }
  };

  // Remove an article from the list
  const removeArticle = (storyId) => {
    const newRemovedIds = new Set(removedStoryIds);
    newRemovedIds.add(storyId);
    setRemovedStoryIds(newRemovedIds);
    saveRemovedArticles(newRemovedIds);

    // Update the main stories list to remove the article
    const updatedStories = stories.filter(story => story.id !== storyId);
    setStories(updatedStories);

    // If we're in search mode, re-apply the search filter
    if (searchMode) {
      // Re-filter the updated stories with the current search query
      const reFiltered = updatedStories.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (story.by && story.by.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (story.url && story.url.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // If the filtered list becomes empty after re-filtering, exit search mode
      if (reFiltered.length === 0) {
        setSearchMode(false);
        setSearchQuery('');
        setFilteredStories([...updatedStories]);
        setSelectedIndex(0);
        setScrollOffset(0);
      } else {
        setFilteredStories(reFiltered);
        // Adjust selected index if needed
        if (selectedIndex >= reFiltered.length) {
          setSelectedIndex(Math.max(0, reFiltered.length - 1));
        }
      }
    } else {
      // Not in search mode, just update filtered stories
      setFilteredStories(updatedStories);
      // Adjust selected index if needed
      if (selectedIndex >= updatedStories.length) {
        setSelectedIndex(Math.max(0, updatedStories.length - 1));
      }
    }
  };

  // Load sample data for development
  const loadSampleData = () => {
    try {
      const sampleDataPath = path.join(__dirname, 'sample-data.json');
      const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
      return sampleData;
    } catch (error) {
      console.error('Error loading sample data:', error);
      return [];
    }
  };

  // Fetch top stories and their details
  const fetchStories = async () => {
    try {
      setLoading(true);

      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Use sample data for development
        const sampleStories = loadSampleData();
        const storiesWithoutRemoved = sampleStories.filter(story => !removedStoryIds.has(story.id));
        const sortedStories = sortStories(storiesWithoutRemoved);
        setStories(sortedStories);
        setFilteredStories(sortedStories);
        setLoading(false);
        return;
      }

      // Get top story IDs
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStoryIds = await topStoriesResponse.json();

      // Fetch details for first 80 stories
      const storyPromises = topStoryIds.slice(0, MAX_STORIES).map(async (id) => {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return response.json();
      });

      const storyDetails = await Promise.all(storyPromises);

      // Filter out deleted/dead stories, only show stories with 50+ comments
      const validStories = storyDetails
        .filter(story => story && !story.deleted && !story.dead && (story.descendants || 0) >= 50);

      // Filter out removed stories and sort
      const storiesWithoutRemoved = validStories.filter(story => !removedStoryIds.has(story.id));
      const sortedStories = sortStories(storiesWithoutRemoved);
      setStories(sortedStories);
      setFilteredStories(sortedStories);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      // Load removed articles first and get the IDs
      const removedIds = loadRemovedArticles();

      // Then fetch stories with the removed IDs
      await fetchStoriesWithRemoved(removedIds);
    };
    initializeApp();
  }, []);

  // Modified fetchStories to accept removed IDs as parameter
  const fetchStoriesWithRemoved = async (removedIds = removedStoryIds) => {
    try {
      setLoading(true);

      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Use sample data for development
        const sampleStories = loadSampleData();
        const storiesWithoutRemoved = sampleStories.filter(story => !removedIds.has(story.id));
        const sortedStories = sortStories(storiesWithoutRemoved);
        setStories(sortedStories);
        setFilteredStories(sortedStories);
        setLoading(false);
        return;
      }

      // Get top story IDs
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStoryIds = await topStoriesResponse.json();

      // Fetch details for first 80 stories
      const storyPromises = topStoryIds.slice(0, MAX_STORIES).map(async (id) => {
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return response.json();
      });

      const storyDetails = await Promise.all(storyPromises);

      // Filter out deleted/dead stories, only show stories with 50+ comments
      const validStories = storyDetails
        .filter(story => story && !story.deleted && !story.dead && (story.descendants || 0) >= 50);

      // Filter out removed stories using the passed removedIds and sort
      const storiesWithoutRemoved = validStories.filter(story => !removedIds.has(story.id));
      const sortedStories = sortStories(storiesWithoutRemoved);

      setStories(sortedStories);
      setFilteredStories(sortedStories);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Filter stories based on search query
  const filterStories = (query) => {
    if (!query.trim()) {
      setFilteredStories(sortStories(stories, sortByComments));
      return;
    }

    const filtered = stories.filter(story =>
      story.title.toLowerCase().includes(query.toLowerCase()) ||
      (story.by && story.by.toLowerCase().includes(query.toLowerCase())) ||
      (story.url && story.url.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredStories(sortStories(filtered, sortByComments));
  };

  // Handle scroll and selection logic
  const updateScrollAndSelection = (newSelectedIndex) => {
    const maxIndex = filteredStories.length - 1;
    const clampedIndex = Math.max(0, Math.min(newSelectedIndex, maxIndex));

    // Calculate new scroll offset
    let newScrollOffset = scrollOffset;
    if (clampedIndex < scrollOffset) {
      newScrollOffset = clampedIndex;
    } else if (clampedIndex >= scrollOffset + STORIES_PER_PAGE) {
      newScrollOffset = clampedIndex - STORIES_PER_PAGE + 1;
    }

    setScrollOffset(newScrollOffset);
    setSelectedIndex(clampedIndex);
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (searchMode) {
      // Search mode - handle search input
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (key.escape) {
        // Exit search mode and clear filter
        setSearchMode(false);
        setSearchQuery('');
        setFilteredStories([...stories]); // Create a new array to ensure state update
        setSelectedIndex(0);
        setScrollOffset(0);
      } else if (key.return) {
        // Exit search mode but keep filter
        setSearchMode(false);
        setSelectedIndex(0);
        setScrollOffset(0);
      } else if (key.backspace || key.delete) {
        // Handle backspace and filter in real-time
        const newQuery = searchQuery.slice(0, -1);
        setSearchQuery(newQuery);
        filterStories(newQuery);
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        // Add character to search query and filter in real-time
        const newQuery = searchQuery + input;
        setSearchQuery(newQuery);
        filterStories(newQuery);
      }
    } else if (modalOpen) {
      // Modal is open - handle modal navigation
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (key.escape) {
        setModalOpen(false);
        setSelectedStory(null);
        setModalSelectedOption(0);
      } else if (key.upArrow || input === 'k') {
        setModalSelectedOption(prev => Math.max(0, prev - 1));
      } else if (key.downArrow || input === 'j') {
        setModalSelectedOption(prev => Math.min(2, prev + 1));
      } else if (key.return) {
        const story = selectedStory;
        if (modalSelectedOption === 0) {
          // Open HN URL (comments)
          try {
            open(`https://news.ycombinator.com/item?id=${story.id}`);
          } catch (error) {
            console.log(`\nError opening HN URL: ${error.message}`);
          }
        } else if (modalSelectedOption === 1 && story.url) {
          // Open actual URL
          try {
            open(story.url);
          } catch (error) {
            console.log(`\nError opening URL: ${error.message}`);
          }
        } else if (modalSelectedOption === 2) {
          // Remove article from list
          removeArticle(story.id);
        }
        setModalOpen(false);
        setSelectedStory(null);
        setModalSelectedOption(0);
      }
    } else if (drawerOpen) {
      // Drawer is open - handle drawer navigation
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (key.escape) {
        setDrawerOpen(false);
        setSelectedStory(null);
        setDrawerSelectedOption(0);
      } else if (key.upArrow || input === 'k') {
        setDrawerSelectedOption(prev => Math.max(0, prev - 1));
      } else if (key.downArrow || input === 'j') {
        setDrawerSelectedOption(prev => Math.min(2, prev + 1));
      } else if (key.return) {
        const story = selectedStory;
        if (drawerSelectedOption === 0) {
          // Open HN URL (comments)
          try {
            open(`https://news.ycombinator.com/item?id=${story.id}`);
          } catch (error) {
            console.log(`\nError opening HN URL: ${error.message}`);
          }
        } else if (drawerSelectedOption === 1 && story.url) {
          // Open actual URL
          try {
            open(story.url);
          } catch (error) {
            console.log(`\nError opening URL: ${error.message}`);
          }
        } else if (drawerSelectedOption === 2) {
          // Remove article from list
          removeArticle(story.id);
        }
        setDrawerOpen(false);
        setSelectedStory(null);
        setDrawerSelectedOption(0);
      }
    } else {
      // Main navigation
      if (input === 'q' || key.ctrl && input === 'c') {
        exit();
      } else if (input === 'r') {
        // Refresh stories
        fetchStoriesWithRemoved(removedStoryIds);
        setSelectedIndex(0);
        setScrollOffset(0);
      } else if (input === 's') {
        // Toggle sort between comments and date
        const newSortByComments = !sortByComments;
        setSortByComments(newSortByComments);
        const sortedStories = sortStories(stories, newSortByComments);
        setStories(sortedStories);
        setFilteredStories(sortStories(filteredStories, newSortByComments));
        setSelectedIndex(0);
        setScrollOffset(0);
        setGKeySequence('');
      } else if (input === '/') {
        // Enter search mode
        setSearchMode(true);
        setSearchQuery('');
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
        updateScrollAndSelection(filteredStories.length - 1);
        setGKeySequence('');
      } else if (key.upArrow || input === 'k') {
        updateScrollAndSelection(selectedIndex - 1);
        setGKeySequence('');
      } else if (key.downArrow || input === 'j') {
        updateScrollAndSelection(selectedIndex + 1);
        setGKeySequence('');
      } else if (input === 'd' && filteredStories[selectedIndex]) {
        // Remove current article directly with 'd' key
        const story = filteredStories[selectedIndex];
        removeArticle(story.id);
        setGKeySequence('');
      } else if (key.return && filteredStories[selectedIndex]) {
        const story = filteredStories[selectedIndex];
        setSelectedStory(story);
        setModalOpen(true);
        setModalSelectedOption(0);
        setGKeySequence('');
      } else if (input === 'v' && filteredStories[selectedIndex]) {
        // Open drawer with 'v' key
        const story = filteredStories[selectedIndex];
        setSelectedStory(story);
        setDrawerOpen(true);
        setDrawerSelectedOption(0);
        setGKeySequence('');
      } else {
        // Reset 'g' sequence for any other key
        setGKeySequence('');
      }
    }
  });


  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>🔥 Hacker News TUI</Text>
        <Text>Loading stories sorted by {sortByComments ? 'comments' : 'date'}...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>Error loading stories:</Text>
        <Text>{error}</Text>
        <Text dimColor>Press 'q' to quit</Text>
      </Box>
    );
  }

  return (
    <Box width="100%" height="100%">
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color="cyan" bold>🔥 Hacker News TUI - Sorted by {sortByComments ? 'Comments' : 'Date'}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>
            Use ↑/↓ arrows or j/k to navigate • gg to top • G to bottom • / to search • Enter for modal • 'v' for drawer • 'd' to remove • 'r' to refresh • 's' to sort • 'q' to quit
          </Text>
        </Box>

        {searchMode && <SearchBox searchQuery={searchQuery} />}

        <StoryList
          stories={filteredStories}
          selectedIndex={selectedIndex}
          scrollOffset={scrollOffset}
          storiesPerPage={STORIES_PER_PAGE}
        />

        {filteredStories.length !== stories.length && (
          <Box marginTop={1}>
            <Text dimColor>Filtered from {stories.length} total</Text>
          </Box>
        )}

        {modalOpen && selectedStory && (
          <StoryModal
            selectedStory={selectedStory}
            modalSelectedOption={modalSelectedOption}
          />
        )}
      </Box>

      {selectedStory && (
        <StoryDrawer
          selectedStory={selectedStory}
          drawerSelectedOption={drawerSelectedOption}
          isOpen={drawerOpen}
        />
      )}
    </Box>
  );
};

// Render the app
render(<HackerNewsTUI />);

export default HackerNewsTUI;
