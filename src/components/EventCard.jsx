import React from 'react';
import { formatDateRange, getCategoryName, getCategoryColor } from '../utils/categories';

function EventCard({ event, onClick, isFavorite, onFavoriteClick }) {
    const categoryClass = event.isFree ? 'free' : event.category;

    return (
        <div
            className={`event-card ${categoryClass}`}
            onClick={onClick}
        >
            <div className="event-card-header">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-badges">
                    {event.isFree && <span className="badge free">Free</span>}
                    <span
                        className="badge category"
                        style={{ borderColor: getCategoryColor(event.category) }}
                    >
                        {getCategoryName(event.category)}
                    </span>
                </div>
            </div>

            <div className="event-meta">
                <div className="event-meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDateRange(event.date, event.endDate)}</span>
                </div>

                {event.time && (
                    <div className="event-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{event.time}</span>
                    </div>
                )}

                <div className="event-meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{event.location}</span>
                </div>

                {!event.isFree && event.price && (
                    <div className="event-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>{event.price}</span>
                    </div>
                )}
            </div>

            {onFavoriteClick && (
                <button
                    className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteClick(event.id);
                    }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px'
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: '16px', height: '16px' }}
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default EventCard;
