/**
 * Event Scraper Script - Auto Updates Every 48 Hours
 * 
 * IMPORTANT: This script ONLY ADDS new events.
 * It NEVER removes existing curated events.
 * 
 * Sources:
 * - Marhaba.qa (web scraping - no API needed)
 * - PredictHQ (optional - needs free API key)
 * 
 * Run manually: node scripts/scrape-events.cjs
 * Runs automatically via GitHub Actions every 48 hours
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load existing events
const eventsPath = path.join(__dirname, '../src/data/events.json');
const existingData = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

// Configuration
const PREDICTHQ_API_KEY = process.env.PREDICTHQ_API_KEY;
const DOHA_LOCATION = '25.2854,51.5310';

/**
 * Make HTTPS request
 */
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DohaEventsBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `https://marhaba.qa${res.headers.location}`;
                return fetchPage(redirectUrl).then(resolve).catch(reject);
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
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error')); }
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
 * Categorize event based on title
 */
function categorizeEvent(title) {
    const t = title.toLowerCase();
    if (t.includes('concert') || t.includes('live') || t.includes('festival') && t.includes('music')) return 'music';
    if (t.includes('marathon') || t.includes('run') || t.includes('sport') || t.includes('karting')) return 'sports';
    if (t.includes('food') || t.includes('brunch') || t.includes('dining')) return 'food';
    if (t.includes('festival') || t.includes('carnival')) return 'festival';
    if (t.includes('exhibition') || t.includes('museum') || t.includes('art') || t.includes('cinema')) return 'arts';
    return 'other';
}

/**
 * Try to extract date from event page
 */
async function getEventDetails(url) {
    try {
        const html = await fetchPage(url);

        // Try to find date patterns
        const dateMatch = html.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
        if (dateMatch) {
            const months = {
                january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
                july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
            };
            const month = months[dateMatch[2].toLowerCase()];
            const day = dateMatch[1].padStart(2, '0');
            return { date: `${dateMatch[3]}-${month}-${day}` };
        }
        return { date: null };
    } catch {
        return { date: null };
    }
}

/**
 * Scrape events from Marhaba.qa
 */
async function scrapeMarhaba() {
    console.log('📡 Fetching from Marhaba.qa...');

    try {
        const html = await fetchPage('https://marhaba.qa/events/');
        const events = [];
        const seen = new Set();

        // Extract event links
        const pattern = /href="(https:\/\/marhaba\.qa\/event\/[^"]+)"/g;
        let match;

        while ((match = pattern.exec(html)) !== null) {
            const url = match[1];
            if (seen.has(url)) continue;
            seen.add(url);

            // Extract title from URL
            const titleMatch = url.match(/\/event\/([^\/]+)\/?$/);
            if (!titleMatch) continue;

            const title = titleMatch[1]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
                .trim();

            // Skip too short or generic titles
            if (title.length < 5 || ['Event', 'Events', 'All'].includes(title)) continue;

            events.push({
                id: generateId(),
                title: title,
                date: null, // Will try to get from page
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

        console.log(`  Found ${events.length} event URLs`);

        // Try to get dates for first 10 events (to avoid too many requests)
        let withDates = 0;
        for (let i = 0; i < Math.min(10, events.length); i++) {
            const details = await getEventDetails(events[i].url);
            if (details.date) {
                events[i].date = details.date;
                withDates++;
            }
        }

        // Filter out events without dates
        const validEvents = events.filter(e => e.date !== null);
        console.log(`✅ ${validEvents.length} events with valid dates from Marhaba.qa`);

        return validEvents;
    } catch (error) {
        console.error('❌ Marhaba.qa error:', error.message);
        return [];
    }
}

/**
 * Fetch from PredictHQ API
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

    const url = `https://api.predicthq.com/v1/events/?` + new URLSearchParams({
        'location_around.origin': DOHA_LOCATION,
        'location_around.radius': '50km',
        'start.gte': today,
        'start.lte': future.toISOString().split('T')[0],
        'limit': 50,
        'sort': 'start',
        'category': 'concerts,festivals,performing-arts,sports,expos'
    });

    try {
        const data = await fetchJSON(url, { 'Authorization': `Bearer ${PREDICTHQ_API_KEY}` });
        if (!data.results) return [];

        console.log(`✅ ${data.results.length} events from PredictHQ`);

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
            url: `https://www.google.com/search?q=${encodeURIComponent(event.title + ' Doha')}`,
            source: 'PredictHQ'
        }));
    } catch (error) {
        console.error('❌ PredictHQ error:', error.message);
        return [];
    }
}

/**
 * Add new events WITHOUT removing existing ones
 */
function addNewEvents(existing, newEvents) {
    const titles = new Set(existing.map(e => e.title.toLowerCase().replace(/[^a-z0-9]/g, '')));
    let added = 0;

    for (const event of newEvents) {
        const normalized = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Only add if title doesn't already exist and has valid date
        if (!titles.has(normalized) && event.title.length > 5 && event.date) {
            existing.push(event);
            titles.add(normalized);
            added++;
        }
    }

    console.log(`➕ Added ${added} NEW events (kept all ${existing.length - added} existing)`);
    return existing;
}

/**
 * Main function - ONLY ADDS, NEVER REMOVES
 */
async function main() {
    console.log('='.repeat(50));
    console.log('🚀 Doha Events Auto-Updater');
    console.log('📅 ' + new Date().toISOString());
    console.log('='.repeat(50));

    // Keep ALL existing events
    let events = [...existingData.events];
    console.log(`📋 Starting with ${events.length} curated events`);

    // Fetch new events from sources
    const marhabaEvents = await scrapeMarhaba();
    const phqEvents = await fetchPredictHQ();

    // Only ADD new events, never remove
    events = addNewEvents(events, marhabaEvents);
    events = addNewEvents(events, phqEvents);

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\n📈 Total events: ${events.length}`);

    // Save (keeping all original data structure)
    const updated = {
        ...existingData,
        events,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(eventsPath, JSON.stringify(updated, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Done! Events updated (only additions, no deletions)');
    console.log('='.repeat(50));
}

main().catch(console.error);
