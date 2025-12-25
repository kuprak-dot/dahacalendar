/**
 * Event Scraper Script
 * Fetches events from Platinumlist and other sources
 * Run: node scripts/scrape-events.js
 */

const fs = require('fs');
const path = require('path');

// Load existing events
const eventsPath = path.join(__dirname, '../src/data/events.json');
const existingData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

// API endpoints that might be available (some may require adjustment)
const SOURCES = {
    platinumlist: 'https://doha.platinumlist.net/api/events', // Example - may need real endpoint
};

/**
 * Generate a simple unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Categorize event based on title/description
 */
function categorizeEvent(title, description = '') {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('concert') || text.includes('live') || text.includes('music') ||
        text.includes('dj') || text.includes('band') || text.includes('orchestra')) {
        return 'music';
    }
    if (text.includes('sport') || text.includes('football') || text.includes('marathon') ||
        text.includes('tennis') || text.includes('golf') || text.includes('race') ||
        text.includes('waterpark') || text.includes('theme park')) {
        return 'sports';
    }
    if (text.includes('food') || text.includes('brunch') || text.includes('dinner') ||
        text.includes('restaurant') || text.includes('culinary') || text.includes('chef')) {
        return 'food';
    }
    if (text.includes('festival') || text.includes('celebration') || text.includes('carnival')) {
        return 'festival';
    }
    if (text.includes('art') || text.includes('exhibition') || text.includes('museum') ||
        text.includes('gallery') || text.includes('theater') || text.includes('theatre') ||
        text.includes('comedy') || text.includes('cinema')) {
        return 'arts';
    }
    return 'other';
}

/**
 * Check if event is free based on price text
 */
function isFreeEvent(priceText) {
    if (!priceText) return false;
    const lower = priceText.toLowerCase();
    return lower.includes('free') || lower === '0' || lower === 'qar 0';
}

/**
 * Merge new events with existing ones (avoid duplicates)
 */
function mergeEvents(existingEvents, newEvents) {
    const existingTitles = new Set(existingEvents.map(e => e.title.toLowerCase()));
    const merged = [...existingEvents];

    for (const event of newEvents) {
        if (!existingTitles.has(event.title.toLowerCase())) {
            merged.push(event);
            existingTitles.add(event.title.toLowerCase());
        }
    }

    return merged;
}

/**
 * Remove past events (keep events from yesterday onwards)
 */
function removePastEvents(events) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return events.filter(event => {
        const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
        return endDate >= yesterday;
    });
}

/**
 * Try to fetch from Platinumlist (example - needs real API)
 */
async function fetchPlatinumlistEvents() {
    // Note: Platinumlist may not have a public API
    // This is a placeholder - you may need to adjust based on actual availability
    console.log('Platinumlist API not available - using existing events');
    return [];
}

/**
 * Main scraper function
 */
async function scrapeEvents() {
    console.log('Starting event scrape...');
    console.log('Current time:', new Date().toISOString());

    let allNewEvents = [];

    try {
        // Try different sources (add more as they become available)
        const platinumEvents = await fetchPlatinumlistEvents();
        allNewEvents = [...allNewEvents, ...platinumEvents];

        console.log(`Found ${allNewEvents.length} new events from APIs`);
    } catch (error) {
        console.error('Error fetching events:', error.message);
    }

    // Merge with existing events
    let updatedEvents = mergeEvents(existingData.events, allNewEvents);

    // Remove past events
    updatedEvents = removePastEvents(updatedEvents);

    // Sort by date
    updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`Total events after merge: ${updatedEvents.length}`);

    // Update the data
    const updatedData = {
        ...existingData,
        events: updatedEvents,
        lastUpdated: new Date().toISOString()
    };

    // Write back to file
    fs.writeFileSync(eventsPath, JSON.stringify(updatedData, null, 2));
    console.log('Events file updated successfully!');
    console.log('Last updated:', updatedData.lastUpdated);
}

// Run the scraper
scrapeEvents().catch(console.error);
