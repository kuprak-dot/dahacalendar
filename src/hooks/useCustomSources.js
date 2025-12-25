import { useState, useEffect } from 'react';

const STORAGE_KEY = 'doha-events-custom-sources';

export function useCustomSources() {
    const [customSources, setCustomSources] = useState(() => {
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(customSources));
        } catch (error) {
            console.error('Failed to save custom sources:', error);
        }
    }, [customSources]);

    const addSource = (source) => {
        const newSource = {
            ...source,
            id: Date.now().toString(),
            isCustom: true
        };
        setCustomSources(prev => [...prev, newSource]);
        return newSource;
    };

    const removeSource = (sourceId) => {
        setCustomSources(prev => prev.filter(s => s.id !== sourceId));
    };

    const updateSource = (sourceId, updates) => {
        setCustomSources(prev => prev.map(s =>
            s.id === sourceId ? { ...s, ...updates } : s
        ));
    };

    return {
        customSources,
        addSource,
        removeSource,
        updateSource
    };
}

export default useCustomSources;
