import { useState, useEffect } from 'react';
import eventsData from '../data/events.json';
import { filterEvents, sortEventsByDate } from '../utils/categories';

export function useEvents(filters = {}) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);

    useEffect(() => {
        // Simulate API loading
        setLoading(true);

        setTimeout(() => {
            setEvents(eventsData.events);
            setSources(eventsData.sources);
            setLoading(false);
        }, 300);
    }, []);

    // Apply filters
    const filteredEvents = filterEvents(events, filters);
    const sortedEvents = sortEventsByDate(filteredEvents);

    return {
        events: sortedEvents,
        allEvents: events,
        sources,
        loading,
        lastUpdated: eventsData.lastUpdated
    };
}

export default useEvents;
