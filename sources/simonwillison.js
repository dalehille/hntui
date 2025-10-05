import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEED_URL = 'https://simonwillison.net/atom/everything/';
const CACHE_FILE = path.join(__dirname, '..', '.cache-simonwillison.json');
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Load sample data for development
 */
const loadSampleData = () => {
    try {
        const sampleDataPath = path.join(__dirname, '..', 'simonwillison-sample-data.json');
        const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
        return sampleData;
    } catch (error) {
        console.error('Error loading Simon Willison sample data:', error);
        return [];
    }
};

/**
 * Check if cache exists and is fresh
 */
const isCacheFresh = () => {
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            return false;
        }
        const stats = fs.statSync(CACHE_FILE);
        const age = Date.now() - stats.mtimeMs;
        return age < CACHE_MAX_AGE_MS;
    } catch (error) {
        return false;
    }
};

/**
 * Load cached data
 */
const loadCache = () => {
    try {
        const data = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading cache:', error);
        return null;
    }
};

/**
 * Save data to cache
 */
const saveCache = (data) => {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving cache:', error);
    }
};

/**
 * Parse Atom feed XML to extract entries
 */
const parseAtomFeed = (xmlData) => {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });

    const result = parser.parse(xmlData);

    // Handle both singular and array entries
    const entries = result.feed?.entry;
    if (!entries) {
        return [];
    }

    return Array.isArray(entries) ? entries : [entries];
};

/**
 * Map Atom entry to standard format
 */
const mapToStandardFormat = (entry, index) => {
    // Extract the ID from the entry URL
    const entryId = entry.id || entry.link?.['@_href'] || `sw-${index}`;

    // Parse the published date
    const dateStr = entry.published || entry.updated;
    const date = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : 0;

    // Get the title
    const title = typeof entry.title === 'object' ? entry.title['#text'] || entry.title : entry.title || 'Untitled';

    // Get the URL - check for link as object or string
    let url = null;
    if (entry.link) {
        if (typeof entry.link === 'object' && entry.link['@_href']) {
            url = entry.link['@_href'];
        } else if (typeof entry.link === 'string') {
            url = entry.link;
        }
    }

    // Get author
    const author = entry.author?.name || 'Simon Willison';

    // Get summary/content
    const summary = entry.summary || entry.content || '';

    return {
        id: entryId,
        title: title,
        url: url,
        source: 'simonwillison',
        score: 0, // Blog posts don't have scores
        author: author,
        commentsUrl: url, // For blogs, the article URL is also where comments would be
        commentsCount: 0, // Blog posts don't have comment counts in the feed
        date: date,
        metadata: {
            summary: summary,
            updated: entry.updated,
            published: entry.published,
        }
    };
};

/**
 * Fetch Atom feed from Simon Willison's blog
 */
const fetchAtomFeed = async () => {
    try {
        const response = await fetch(FEED_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const xmlData = await response.text();
        return xmlData;
    } catch (error) {
        console.error('Error fetching Simon Willison feed:', error);
        throw error;
    }
};

/**
 * Fetch stories from Simon Willison's blog
 * @param {Set} removedIds - Set of story IDs to exclude
 * @param {Object} options - Options object
 * @param {boolean} options.forceRefresh - If true, bypass cache and fetch fresh data
 * @returns {Promise<Array>} Array of stories in standard format
 */
export const fetchStories = async (removedIds = new Set(), options = {}) => {
    const { forceRefresh = false } = options;

    try {
        // Use sample data in development mode
        if (process.env.NODE_ENV === 'development') {
            const sampleStories = loadSampleData();
            const storiesWithoutRemoved = sampleStories.filter(story => !removedIds.has(story.id));
            return storiesWithoutRemoved;
        }

        // Check cache first (unless force refresh is requested)
        if (!forceRefresh && isCacheFresh()) {
            const cachedData = loadCache();
            if (cachedData) {
                const storiesWithoutRemoved = cachedData.filter(story => !removedIds.has(story.id));
                return storiesWithoutRemoved;
            }
        }

        // Fetch fresh data
        const xmlData = await fetchAtomFeed();
        const entries = parseAtomFeed(xmlData);

        // Map to standard format
        const stories = entries.map((entry, index) => mapToStandardFormat(entry, index));

        // Save to cache
        saveCache(stories);

        // Filter out removed stories
        const storiesWithoutRemoved = stories.filter(story => !removedIds.has(story.id));

        return storiesWithoutRemoved;
    } catch (error) {
        console.error('Error fetching Simon Willison stories:', error);
        throw error;
    }
};

/**
 * Get the source metadata
 */
export const getSourceInfo = () => {
    return {
        id: 'simonwillison',
        name: 'Simon Willison',
        supportsComments: false,
        supportsScores: false,
    };
};

