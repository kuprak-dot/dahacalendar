/**
 * Event Scraper Script - Auto Updates Every 48 Hours
 * 
 * Sources:
 * - Marhaba.qa (web scraping - no API needed)
 * - PredictHQ (optional - needs free API key)
 * 
 * Run manually: node scripts/scrape-events.js
 * Runs automatically via GitHub Actions every 48 hours
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load existing events
const eventsPath = path.join(__dirname, '../src/data/events.json');
const existingData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

// Configuration
const PREDICTHQ_API_KEY = process.env.PREDICTHQ_API_KEY;
const DOHA_LOCATION = '25.2854,51.5310';

/**
 * Make HTTP/HTTPS request
 */
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DohaEventsBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };

        client.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Fetch JSON with auth
 */
function fetchJSON(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: { 'Accept': 'application/json', ...headers }
        };

        https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON'));
                }
            });
        }).on('error', reject).end();
    });
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Parse date strings like "26-12-2024" or "December 26, 2024"
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Try DD-MM-YYYY format
    const ddmmyyyy = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    // Try to parse with Date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Categorize event based on title
 */
function categorizeEvent(title) {
    const t = title.toLowerCase();

    if (t.includes('concert') || t.includes('live') || t.includes('music') ||
        t.includes('night') || t.includes('festival') && (t.includes('music'))) {
        return 'music';
    }
    if (t.includes('marathon') || t.includes('run') || t.includes('sport') ||
        t.includes('football') || t.includes('tennis') || t.includes('golf') ||
        t.includes('karting') || t.includes('waterpark') || t.includes('ride') ||
        t.includes('cycling') || t.includes('swimming')) {
        return 'sports';
    }
    if (t.includes('food') || t.includes('brunch') || t.includes('culinary') ||
        t.includes('chef') || t.includes('dining') || t.includes('restaurant')) {
        return 'food';
    }
    if (t.includes('festival') || t.includes('carnival') || t.includes('firework') ||
        t.includes('celebration') || t.includes('winter wonderland')) {
        return 'festival';
    }
    if (t.includes('exhibition') || t.includes('museum') || t.includes('gallery') ||
        t.includes('art') || t.includes('theater') || t.includes('theatre') ||
        t.includes('cinema') || t.includes('comedy') || t.includes('play')) {
        return 'arts';
    }
    return 'other';
}

/**
 * Scrape events from Marhaba.qa
 */
async function scrapeMarhaba() {
    console.log('📡 Fetching from Marhaba.qa...');

    try {
        const html = await fetchPage('https://marhaba.qa/events/');
        const events = [];

        // Extract event links and titles using regex
        const eventPattern = /<a[^>]*href="(https:\/\/marhaba\.qa\/event\/[^"]+)"[^>]*>([^<]*)</gi;
        let match;
        const seen = new Set();

        while ((match = eventPattern.exec(html)) !== null) {
            const url = match[1];
            const title = match[2].trim();

            if (!title || seen.has(url) || title.length < 3) continue;
            seen.add(url);

            // Skip navigation/header links
            if (['Events', 'Venues', 'Classes', 'All'].includes(title)) continue;

            events.push({
                id: generateId(),
                title: title,
                date: getTodayDate(), // Will be updated when we have more info
                endDate: null,
                time: null,
                location: 'Doha, Qatar',
                category: categorizeEvent(title),
                isFree: false,
                price: 'Check website',
                description: title,
                url: url,
                source: 'Marhaba'
            });
        }

        console.log(`✅ Found ${events.length} events from Marhaba.qa`);
        return events.slice(0, 30); // Limit to top 30

    } catch (error) {
        console.error('❌ Marhaba.qa error:', error.message);
        return [];
    }
}

/**
 * Fetch events from PredictHQ API
 */
async function fetchPredictHQ() {
    if (!PREDICTHQ_API_KEY) {
        console.log('⚠️  PREDICTHQ_API_KEY not set - skipping');
        return [];
    }

    console.log('📡 Fetching from PredictHQ API...');

    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    const endDate = future.toISOString().split('T')[0];

    const url = `https://api.predicthq.com/v1/events/?` + new URLSearchParams({
        'location_around.origin': DOHA_LOCATION,
        'location_around.radius': '50km',
        'start.gte': today,
        'start.lte': endDate,
        'limit': 50,
        'sort': 'start',
        'category': 'concerts,festivals,performing-arts,sports,community,expos'
    });

    try {
        const data = await fetchJSON(url, {
            'Authorization': `Bearer ${PREDICTHQ_API_KEY}`
        });

        if (!data.results) return [];

        console.log(`✅ Found ${data.results.length} events from PredictHQ`);

        return data.results.map(event => ({
            id: generateId(),
            title: event.title,
            date: event.start.split('T')[0],
            endDate: event.end ? event.end.split('T')[0] : null,
            time: event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : null,
            location: event.geo?.address?.formatted_address || 'Doha, Qatar',
            category: categorizeEvent(event.title),
            isFree: false,
            price: 'Check website',
            description: event.description || event.title,
            url: `https://www.google.com/search?q=${encodeURIComponent(event.title + ' Doha Qatar')}`,
            source: 'PredictHQ'
        }));
    } catch (error) {
        console.error('❌ PredictHQ error:', error.message);
        return [];
    }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Merge events without duplicates
 */
function mergeEvents(existing, newEvents) {
    const titles = new Set(existing.map(e => e.title.toLowerCase().replace(/[^a-z0-9]/g, '')));
    let added = 0;

    for (const event of newEvents) {
        const normalized = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!titles.has(normalized) && event.title.length > 5) {
            existing.push(event);
            titles.add(normalized);
            added++;
        }
    }

    console.log(`➕ Added ${added} new events`);
    return existing;
}

/**
 * Remove past events
 */
function removePastEvents(events) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);

    const before = events.length;
    const filtered = events.filter(e => {
        const end = e.endDate ? new Date(e.endDate) : new Date(e.date);
        return end >= cutoff;
    });

    console.log(`🗑️  Removed ${before - filtered.length} past events`);
    return filtered;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(50));
    console.log('🚀 Doha Events Auto-Updater');
    console.log('📅 ' + new Date().toISOString());
    console.log('='.repeat(50));

    // Fetch from all sources
    const marhabaEvents = await scrapeMarhaba();
    const phqEvents = await fetchPredictHQ();

    console.log(`\n📊 Total new: ${marhabaEvents.length + phqEvents.length}`);

    // Merge with existing
    let events = [...existingData.events];
    events = mergeEvents(events, marhabaEvents);
    events = mergeEvents(events, phqEvents);

    // Clean up
    events = removePastEvents(events);
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\n📈 Total events: ${events.length}`);

    // Save
    const updated = {
        ...existingData,
        events,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(eventsPath, JSON.stringify(updated, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Done! Events updated.');
    console.log('='.repeat(50));
}

main().catch(console.error);
