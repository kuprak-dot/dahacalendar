import { useState, useEffect } from 'react';

const STORAGE_KEY = 'doha-events-favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }, [favorites]);

    const addFavorite = (eventId) => {
        setFavorites(prev => {
            if (prev.includes(eventId)) return prev;
            return [...prev, eventId];
        });
    };

    const removeFavorite = (eventId) => {
        setFavorites(prev => prev.filter(id => id !== eventId));
    };

    const toggleFavorite = (eventId) => {
        if (favorites.includes(eventId)) {
            removeFavorite(eventId);
        } else {
            addFavorite(eventId);
        }
    };

    const isFavorite = (eventId) => {
        return favorites.includes(eventId);
    };

    const clearFavorites = () => {
        setFavorites([]);
    };

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites
    };
}

export default useFavorites;
