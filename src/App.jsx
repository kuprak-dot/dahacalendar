import React, { useState, useMemo } from 'react';
import Calendar from './components/Calendar';
import EventCard from './components/EventCard';
import EventModal from './components/EventModal';
import FilterBar from './components/FilterBar';
import Navigation from './components/Navigation';
import { useEvents } from './hooks/useEvents';
import { useFavorites } from './hooks/useFavorites';
import { useReminders } from './hooks/useReminders';
import { useCustomSources } from './hooks/useCustomSources';
import { getEventsForDate, filterEvents } from './utils/categories';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceDesc, setNewSourceDesc] = useState('');

  const { events, allEvents, sources, loading } = useEvents();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { hasReminder, toggleReminder } = useReminders();
  const { customSources, addSource, removeSource: removeCustomSource } = useCustomSources();

  // Filter events based on active filter and search
  const filteredEvents = useMemo(() => {
    return filterEvents(allEvents, {
      category: activeFilter,
      search: searchQuery
    });
  }, [allEvents, activeFilter, searchQuery]);

  // Get events for selected date
  const dateEvents = useMemo(() => {
    return getEventsForDate(filteredEvents, selectedDate);
  }, [filteredEvents, selectedDate]);

  // Get favorite events
  const favoriteEvents = useMemo(() => {
    return allEvents.filter(e => favorites.includes(e.id));
  }, [allEvents, favorites]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleReminderClick = async () => {
    if (selectedEvent) {
      await toggleReminder(selectedEvent);
    }
  };

  const handleAddSource = (e) => {
    e.preventDefault();
    if (newSourceName && newSourceUrl) {
      addSource({
        name: newSourceName,
        url: newSourceUrl,
        description: newSourceDesc
      });
      setNewSourceName('');
      setNewSourceUrl('');
      setNewSourceDesc('');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      );
    }

    switch (activeTab) {
      case 'calendar':
        return (
          <>
            <Calendar
              events={filteredEvents}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>
                Events on {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {dateEvents.length > 0 ? (
              dateEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isFavorite={isFavorite(event.id)}
                  onFavoriteClick={toggleFavorite}
                />
              ))
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h3>No events on this day</h3>
                <p>Select another date or browse all events</p>
              </div>
            )}
          </>
        );

      case 'events':
        return (
          <>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '12px'
            }}>
              Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </p>

            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isFavorite={isFavorite(event.id)}
                  onFavoriteClick={toggleFavorite}
                />
              ))
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3>No events found</h3>
                <p>Try adjusting your filters</p>
              </div>
            )}
          </>
        );

      case 'favorites':
        return (
          <>
            <h2 style={{ marginBottom: '16px' }}>My Favorites</h2>

            {favoriteEvents.length > 0 ? (
              favoriteEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isFavorite={true}
                  onFavoriteClick={toggleFavorite}
                />
              ))
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <h3>No favorites yet</h3>
                <p>Tap the heart icon on any event to save it here</p>
              </div>
            )}
          </>
        );

      case 'sources':
        return (
          <>
            <h2 style={{ marginBottom: '16px' }}>Event Sources</h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}>
              Browse events directly from these websites for the most up-to-date listings.
            </p>

            <div className="sources-section" style={{ marginTop: 0 }}>
              {sources.map((source, index) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                    style={{
                      display: 'block',
                      padding: '16px',
                      borderRadius: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {source.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {source.description}
                    </div>
                  </a>
                </div>
              ))}

              {/* Custom Sources */}
              {customSources.map((source) => (
                <div key={source.id} style={{ marginBottom: '12px', position: 'relative' }}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                    style={{
                      display: 'block',
                      padding: '16px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      border: '1px solid var(--color-accent)'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {source.name}
                      <span style={{
                        fontSize: '0.65rem',
                        background: 'var(--color-accent)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>Custom</span>
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {source.description || source.url}
                    </div>
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeCustomSource(source.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Source Form */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--color-bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)'
            }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>➕ Add Custom Source</h3>
              <form onSubmit={handleAddSource}>
                <input
                  type="text"
                  placeholder="Source name (e.g., Qatar Museums)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="search-input"
                  style={{ marginBottom: '8px' }}
                  required
                />
                <input
                  type="url"
                  placeholder="URL (e.g., https://qm.org.qa/events)"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="search-input"
                  style={{ marginBottom: '8px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newSourceDesc}
                  onChange={(e) => setNewSourceDesc(e.target.value)}
                  className="search-input"
                  style={{ marginBottom: '12px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Add Source
                </button>
              </form>
            </div>

            {/* How Updates Work */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--color-bg-glass)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)'
            }}>
              <h3 style={{ color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '12px' }}>🔄 How Updates Work</h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Automatic:</strong> Events are stored in a data file. When the app is deployed,
                it will show the latest events from that file.
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>To update events:</strong>
              </p>
              <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                <li>Edit <code>src/data/events.json</code> on GitHub</li>
                <li>Add new events with date, location, category</li>
                <li>Commit changes → Vercel auto-deploys!</li>
              </ol>
              <p style={{ marginBottom: '8px' }}>
                <strong>Your custom sources</strong> above are saved on your device and will always be available for quick access.
              </p>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--color-bg-glass)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)'
            }}>
              <strong style={{ color: 'var(--color-text)' }}>📅 Last updated:</strong>
              <br />
              December 25, 2024
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🇶🇦 Doha Events</h1>
        <p className="header-subtitle">Discover what's happening in Qatar</p>
      </header>

      <main className="container">
        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          isFavorite={isFavorite(selectedEvent.id)}
          onFavoriteClick={toggleFavorite}
          hasReminder={hasReminder(selectedEvent.id)}
          onReminderClick={handleReminderClick}
        />
      )}
    </div>
  );
}

export default App;
