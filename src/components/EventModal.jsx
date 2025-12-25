import React from 'react';
import { formatDateRange, getCategoryName, getCategoryColor } from '../utils/categories';

function EventModal({ event, onClose, isFavorite, onFavoriteClick, hasReminder, onReminderClick }) {
    if (!event) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <div className="event-badges" style={{ marginBottom: '8px' }}>
                        {event.isFree && <span className="badge free">Free</span>}
                        <span
                            className="badge category"
                            style={{ borderColor: getCategoryColor(event.category) }}
                        >
                            {getCategoryName(event.category)}
                        </span>
                    </div>

                    <h2 className="modal-title">{event.title}</h2>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h4 className="modal-section-title">When</h4>
                        <p>{formatDateRange(event.date, event.endDate)}</p>
                        {event.time && <p style={{ color: 'var(--color-text-secondary)' }}>{event.time}</p>}
                    </div>

                    <div className="modal-section">
                        <h4 className="modal-section-title">Where</h4>
                        <p>{event.location}</p>
                    </div>

                    {!event.isFree && event.price && (
                        <div className="modal-section">
                            <h4 className="modal-section-title">Price</h4>
                            <p>{event.price}</p>
                        </div>
                    )}

                    {event.description && (
                        <div className="modal-section">
                            <h4 className="modal-section-title">About</h4>
                            <p className="modal-description">{event.description}</p>
                        </div>
                    )}

                    <div className="modal-section">
                        <h4 className="modal-section-title">Source</h4>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{event.source}</p>
                    </div>

                    {/* Reminder Section */}
                    <div className="reminder-section">
                        <div className="reminder-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span>Remind me</span>
                        </div>
                        <div
                            className={`toggle ${hasReminder ? 'active' : ''}`}
                            onClick={onReminderClick}
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className={`btn btn-secondary ${isFavorite ? 'btn-favorite active' : ''}`}
                        onClick={() => onFavoriteClick(event.id)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>

                    <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Go to Event Page
                    </a>
                </div>
            </div>
        </div>
    );
}

export default EventModal;
