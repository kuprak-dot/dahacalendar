import React, { useState } from 'react';
import { getEventsForDate, getCategoryColor } from '../utils/categories';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar({ events, selectedDate, onDateSelect }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month days
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
        onDateSelect(new Date());
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const getEventDotsForDate = (date) => {
        const dateEvents = getEventsForDate(events, date);
        const categories = [...new Set(dateEvents.map(e => e.isFree ? 'free' : e.category))];
        return categories.slice(0, 4); // Max 4 dots
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="calendar">
            <div className="calendar-header">
                <h2 className="calendar-title">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="calendar-nav">
                    <button onClick={goToToday} title="Go to today">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </button>
                    <button onClick={() => navigateMonth(-1)} title="Previous month">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button onClick={() => navigateMonth(1)} title="Next month">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                {DAYS.map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {days.map(({ date, isCurrentMonth }, index) => {
                    const eventDots = getEventDotsForDate(date);
                    return (
                        <div
                            key={index}
                            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
                            onClick={() => onDateSelect(date)}
                        >
                            <span className="calendar-day-number">{date.getDate()}</span>
                            {eventDots.length > 0 && (
                                <div className="event-dots">
                                    {eventDots.map((category, i) => (
                                        <span
                                            key={i}
                                            className={`event-dot ${category}`}
                                            style={{ backgroundColor: getCategoryColor(category) }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;
