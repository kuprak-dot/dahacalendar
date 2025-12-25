/**
 * Event Scraper Script with API Integration
 * Fetches events from PredictHQ API and other sources
 * 
 * APIs Used:
 * - PredictHQ (free tier: 1000 calls/month) - https://www.predicthq.com/
 * 
 * Run: node scripts/scrape-events.js
 * 
 * Environment Variables Required:
 * - PREDICTHQ_API_KEY: Your PredictHQ API token
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load existing events
const eventsPath = path.join(__dirname, '../src/data/events.json');
const existingData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

// API Configuration
const PREDICTHQ_API_KEY = process.env.PREDICTHQ_API_KEY;
const DOHA_LOCATION = '25.2854,51.5310'; // Doha coordinates
const RADIUS = '50km';

/**
 * Make HTTPS request
 */
function fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${data.substring(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Generate a unique ID
 */
function generateId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Map PredictHQ category to our categories
 */
function mapCategory(phqCategory) {
    const mapping = {
        'concerts': 'music',
        'festivals': 'festival',
        'performing-arts': 'arts',
        'sports': 'sports',
        'community': 'other',
        'expos': 'arts',
        'conferences': 'other',
        'academic': 'arts',
        'public-holidays': 'festival',
        'observances': 'other',
        'daylight-savings': 'other',
        'politics': 'other',
        'school-holidays': 'other',
        'severe-weather': 'other',
        'airport-delays': 'other',
        'disasters': 'other',
        'terror': 'other',
        'health-warnings': 'other'
    };
    return mapping[phqCategory] || 'other';
}

/**
 * Fetch events from PredictHQ API
 */
async function fetchPredictHQEvents() {
    if (!PREDICTHQ_API_KEY) {
        console.log('⚠️  PREDICTHQ_API_KEY not set - skipping PredictHQ');
        return [];
    }

    console.log('📡 Fetching from PredictHQ API...');

    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // 3 months ahead
    const endDate = futureDate.toISOString().split('T')[0];

    const url = `https://api.predicthq.com/v1/events/?` + new URLSearchParams({
        'location_around.origin': DOHA_LOCATION,
        'location_around.radius': RADIUS,
        'start.gte': today,
        'start.lte': endDate,
        'limit': 100,
        'sort': 'start',
        'category': 'concerts,festivals,performing-arts,sports,community,expos'
    });

    try {
        const data = await fetchJSON(url, {
            'Authorization': `Bearer ${PREDICTHQ_API_KEY}`
        });

        if (!data.results) {
            console.log('⚠️  No results from PredictHQ:', data);
            return [];
        }

        console.log(`✅ Found ${data.results.length} events from PredictHQ`);

        return data.results.map(event => ({
            id: generateId(),
            title: event.title,
            date: event.start.split('T')[0],
            endDate: event.end ? event.end.split('T')[0] : null,
            time: event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : null,
            location: event.geo?.address?.formatted_address ||
                event.entities?.[0]?.name ||
                'Doha, Qatar',
            category: mapCategory(event.category),
            isFree: false, // PredictHQ doesn't provide pricing
            price: 'Check website',
            description: event.description || `${event.title} in Doha, Qatar`,
            url: event.entities?.[0]?.links?.[0] ||
                `https://www.google.com/search?q=${encodeURIComponent(event.title + ' Doha Qatar')}`,
            source: 'PredictHQ'
        }));
    } catch (error) {
        console.error('❌ PredictHQ error:', error.message);
        return [];
    }
}

/**
 * Fetch from open event sources (no API key needed)
 */
async function fetchOpenEvents() {
    console.log('📡 Checking open event sources...');

    // We could add more open APIs here
    // For now, this is a placeholder for future expansion

    return [];
}

/**
 * Merge new events with existing ones (avoid duplicates by title similarity)
 */
function mergeEvents(existingEvents, newEvents) {
    const existingTitles = new Set(
        existingEvents.map(e => e.title.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    const merged = [...existingEvents];
    let added = 0;

    for (const event of newEvents) {
        const normalizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!existingTitles.has(normalizedTitle)) {
            merged.push(event);
            existingTitles.add(normalizedTitle);
            added++;
        }
    }

    console.log(`➕ Added ${added} new events`);
    return merged;
}

/**
 * Remove past events (keep events from yesterday onwards)
 */
function removePastEvents(events) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const before = events.length;
    const filtered = events.filter(event => {
        const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
        return endDate >= yesterday;
    });

    console.log(`🗑️  Removed ${before - filtered.length} past events`);
    return filtered;
}

/**
 * Main scraper function
 */
async function scrapeEvents() {
    console.log('='.repeat(50));
    console.log('🚀 Starting event scraper...');
    console.log('📅 Current time:', new Date().toISOString());
    console.log('='.repeat(50));

    let allNewEvents = [];

    // Fetch from all sources
    const phqEvents = await fetchPredictHQEvents();
    allNewEvents = [...allNewEvents, ...phqEvents];

    const openEvents = await fetchOpenEvents();
    allNewEvents = [...allNewEvents, ...openEvents];

    console.log(`\n📊 Total new events found: ${allNewEvents.length}`);

    // Merge with existing events
    let updatedEvents = mergeEvents(existingData.events, allNewEvents);

    // Remove past events
    updatedEvents = removePastEvents(updatedEvents);

    // Sort by date
    updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\n📈 Total events after processing: ${updatedEvents.length}`);

    // Update the data
    const updatedData = {
        ...existingData,
        events: updatedEvents,
        lastUpdated: new Date().toISOString()
    };

    // Write back to file
    fs.writeFileSync(eventsPath, JSON.stringify(updatedData, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Events file updated successfully!');
    console.log('📅 Last updated:', updatedData.lastUpdated);
    console.log('='.repeat(50));
}

// Run the scraper
scrapeEvents().catch(error => {
    console.error('❌ Scraper failed:', error);
    process.exit(1);
});
