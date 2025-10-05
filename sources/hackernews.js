import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_STORIES = 100;

/**
 * Fetch a single story with retry logic
 */
const fetchStoryWithRetry = async (id, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (attempt === maxRetries - 1) {
                console.error(`Failed to fetch story ${id} after ${maxRetries} attempts:`, error.message);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
    }
};

/**
 * Fetch stories in batches to avoid overwhelming the connection
 */
const fetchStoriesInBatches = async (storyIds, batchSize = 25) => {
    const results = [];

    for (let i = 0; i < storyIds.length; i += batchSize) {
        const batch = storyIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => fetchStoryWithRetry(id));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (i + batchSize < storyIds.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    return results;
};

/**
 * Load sample data for development
 */
const loadSampleData = () => {
    try {
        const sampleDataPath = path.join(__dirname, '..', 'sample-data.json');
        const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
        return sampleData;
    } catch (error) {
        console.error('Error loading sample data:', error);
        return [];
    }
};

/**
 * Map Hacker News story to standard format
 */
const mapToStandardFormat = (hnStory) => {
    return {
        id: hnStory.id,
        title: hnStory.title,
        url: hnStory.url || null,
        source: 'hackernews',
        score: hnStory.score || 0,
        author: hnStory.by,
        commentsUrl: `https://news.ycombinator.com/item?id=${hnStory.id}`,
        commentsCount: hnStory.descendants || 0,
        date: hnStory.time,
        metadata: {
            type: hnStory.type,
            // Store original HN fields for backward compatibility
            descendants: hnStory.descendants,
            time: hnStory.time,
            by: hnStory.by,
        }
    };
};

/**
 * Fetch Hacker News stories
 * @param {Set} removedIds - Set of story IDs to exclude
 * @param {Object} options - Options object (for API consistency, not currently used)
 * @returns {Promise<Array>} Array of stories in standard format
 */
export const fetchStories = async (removedIds = new Set(), options = {}) => {
    try {
        // Use sample data in development mode
        if (process.env.NODE_ENV === 'development') {
            const sampleStories = loadSampleData();
            const storiesWithoutRemoved = sampleStories.filter(story => !removedIds.has(story.id));
            return storiesWithoutRemoved.map(mapToStandardFormat);
        }

        // Fetch from real API in production
        const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const topStoryIds = await topStoriesResponse.json();

        const storyDetails = await fetchStoriesInBatches(topStoryIds.slice(0, MAX_STORIES));

        const validStories = storyDetails
            .filter(story => story && !story.deleted && !story.dead && (story.descendants || 0) >= 50);

        const storiesWithoutRemoved = validStories.filter(story => !removedIds.has(story.id));

        return storiesWithoutRemoved.map(mapToStandardFormat);
    } catch (error) {
        console.error('Error fetching Hacker News stories:', error);
        throw error;
    }
};

/**
 * Get the source metadata
 */
export const getSourceInfo = () => {
    return {
        id: 'hackernews',
        name: 'Hacker News',
        supportsComments: true,
        supportsScores: true,
    };
};

