#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HackerNewsTUI = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [modalSelectedOption, setModalSelectedOption] = useState(0);
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

  // Fetch top stories and their details
  const fetchStories = async () => {
    try {
      setLoading(true);
      
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
      if (key.escape) {
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
      if (key.escape) {
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
      } else {
        // Reset 'g' sequence for any other key
        setGKeySequence('');
      }
    }
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const formatTitle = (title, maxLength = 70) => {
    return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
  };

  const formatUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

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
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>🔥 Hacker News TUI - Sorted by {sortByComments ? 'Comments' : 'Date'}</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text dimColor>
          Use ↑/↓ arrows or j/k to navigate • gg to top • G to bottom • / to search • Enter to view/remove URL • 'd' to remove • 'r' to refresh • 's' to sort • 'q' to quit
        </Text>
      </Box>

      {searchMode && (
        <Box marginBottom={1} backgroundColor="blue" paddingX={1}>
          <Text color="white" bold>Search: /{searchQuery}</Text>
          <Text color="gray" dimColor> • Press Enter to confirm or Escape to clear</Text>
        </Box>
      )}

      {filteredStories.slice(scrollOffset, scrollOffset + STORIES_PER_PAGE).map((story, index) => {
        const actualIndex = scrollOffset + index;
        const isSelected = actualIndex === selectedIndex;
        const bgColor = isSelected ? 'blue' : undefined;
        const textColor = isSelected ? 'white' : undefined;
        
        return (
          <Box key={story.id} backgroundColor={bgColor} paddingX={1}>
            <Box width={3}>
              <Text color={textColor} dimColor={!isSelected}>
                {(actualIndex + 1).toString().padStart(2, ' ')}.
              </Text>
            </Box>
            
            <Box flexDirection="column" flexGrow={1}>
              <Box>
                <Text color={textColor} bold={isSelected}>
                  {formatTitle(story.title)}
                </Text>
                {story.url && (
                  <Text color="gray" dimColor>
                    {' '}({formatUrl(story.url)})
                  </Text>
                )}
              </Box>
              
              <Box>
                <Text color="gray" dimColor>
                  {story.score || 0} points by {story.by} {formatTime(story.time)}
                </Text>
                <Text color="yellow" dimColor>
                  {' '}| {story.descendants || 0} comments
                </Text>
              </Box>
            </Box>
          </Box>
        );
      })}
      
      <Box marginTop={1}>
        <Text dimColor>
          Showing {Math.min(STORIES_PER_PAGE, filteredStories.length - scrollOffset)} of {filteredStories.length} stories • Selected: {selectedIndex + 1}
          {filteredStories.length !== stories.length && ` • Filtered from ${stories.length} total`}
        </Text>
      </Box>

      {modalOpen && selectedStory && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width="60%"
          height="40%"
          borderStyle="round"
          borderColor="cyan"
          backgroundColor="black"
          padding={2}
          flexDirection="column"
        >
          <Box marginBottom={2}>
            <Text color="cyan" bold>Choose URL to open:</Text>
          </Box>
          
          <Box flexDirection="column" marginBottom={2}>
            <Box
              backgroundColor={modalSelectedOption === 0 ? 'blue' : undefined}
              paddingX={1}
              paddingY={0.5}
            >
              <Text color={modalSelectedOption === 0 ? 'white' : undefined}>
                1. Open Hacker News comments
              </Text>
            </Box>
            
            <Box
              backgroundColor={modalSelectedOption === 1 ? 'blue' : undefined}
              paddingX={1}
              paddingY={0.5}
            >
              <Text color={modalSelectedOption === 1 ? 'white' : undefined}>
                {selectedStory.url ? '2. Open article URL' : '2. No external URL available'}
              </Text>
            </Box>
            
            <Box
              backgroundColor={modalSelectedOption === 2 ? 'blue' : undefined}
              paddingX={1}
              paddingY={0.5}
            >
              <Text color={modalSelectedOption === 2 ? 'white' : undefined}>
                3. Remove from list
              </Text>
            </Box>
          </Box>
          
          <Box>
            <Text dimColor>
              Use j/k to navigate • Enter to select • Escape to cancel
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Render the app
render(<HackerNewsTUI />);

export default HackerNewsTUI;
