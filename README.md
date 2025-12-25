# Doha Events Calendar

🇶🇦 A mobile-friendly calendar application for discovering events in Doha, Qatar.

## Features

- 📅 **Calendar View** - See events on a monthly calendar with color-coded dots
- 🎨 **Category Colors**:
  - 🆓 Green - Free events
  - ⚽ Blue - Sports
  - 🎵 Purple - Music/Concerts
  - 🎭 Amber - Arts/Culture
  - 🍽️ Red - Food/Festivals
- ❤️ **Favorites** - Save events you're interested in
- 🔔 **Reminders** - Get notified before events start
- 🔍 **Search & Filter** - Find events by name or category
- 📱 **PWA** - Install on your phone like a native app

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Deployment to Vercel

1. Push this repository to GitHub
2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite and configure accordingly
3. Deploy!

## Updating Events

Edit `src/data/events.json` to add, update, or remove events. Each event should have:

```json
{
  "id": "unique-id",
  "title": "Event Name",
  "date": "2024-12-25",
  "endDate": "2024-12-26",
  "time": "18:00",
  "location": "Venue Name, Doha",
  "category": "music",
  "isFree": false,
  "price": "From QAR 100",
  "description": "Event description",
  "url": "https://event-page-url.com",
  "source": "Source Name"
}
```

### Categories

- `sports` - Sports events
- `music` - Concerts, music festivals
- `arts` - Art exhibitions, cultural events
- `food` - Food festivals, dining experiences
- `festival` - General festivals
- `other` - Everything else

## Event Sources

The app aggregates events from:
- [Platinumlist](https://doha.platinumlist.net/)
- [Education City](https://educationcity.qa/events)
- [Qatar Living](https://www.qatarliving.com/en/events)
- [Visit Qatar](https://visitqatar.qa)
- [Time Out Doha](https://www.timeoutdoha.com/things-to-do)

## Tech Stack

- React + Vite
- PWA (Progressive Web App)
- LocalStorage for favorites & reminders
- Browser Notifications API

## License

MIT
