import React from 'react';
import { CATEGORIES } from '../utils/categories';

function FilterBar({ activeFilter, onFilterChange, showFreeOnly, onFreeToggle }) {
    const filters = [
        { id: 'all', name: 'All', color: '#6366f1' },
        ...Object.entries(CATEGORIES).map(([id, { name, color }]) => ({
            id,
            name,
            color
        }))
    ];

    return (
        <div className="filter-bar">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => onFilterChange(filter.id)}
                >
                    <span
                        className="dot"
                        style={{ backgroundColor: filter.color }}
                    />
                    {filter.name}
                </button>
            ))}
        </div>
    );
}

export default FilterBar;
