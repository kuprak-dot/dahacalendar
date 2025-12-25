import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'doha-events-reminders';

export function useReminders() {
    const [reminders, setReminders] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const [permission, setPermission] = useState('default');

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Persist reminders to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
        } catch (error) {
            console.error('Failed to save reminders:', error);
        }
    }, [reminders]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Failed to request permission:', error);
            return false;
        }
    }, []);

    // Set reminder for an event
    const setReminder = useCallback(async (event, hoursBeforeParam = 1) => {
        // Use default value if no parameter provided
        const hoursBefore = hoursBeforeParam || 1;

        // Request permission if needed
        if (permission !== 'granted') {
            const granted = await requestPermission();
            if (!granted) {
                alert('Please enable notifications to set reminders');
                return false;
            }
        }

        const eventDate = new Date(event.date);
        const [hours] = event.time?.split(':') || ['12'];
        eventDate.setHours(parseInt(hours), 0, 0, 0);

        const reminderTime = new Date(eventDate.getTime() - (hoursBefore * 60 * 60 * 1000));

        setReminders(prev => ({
            ...prev,
            [event.id]: {
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.date,
                eventTime: event.time,
                reminderTime: reminderTime.toISOString(),
                hoursBefore,
                notified: false
            }
        }));

        return true;
    }, [permission, requestPermission]);

    // Remove reminder
    const removeReminder = useCallback((eventId) => {
        setReminders(prev => {
            const updated = { ...prev };
            delete updated[eventId];
            return updated;
        });
    }, []);

    // Check if event has reminder
    const hasReminder = useCallback((eventId) => {
        return !!reminders[eventId];
    }, [reminders]);

    // Toggle reminder
    const toggleReminder = useCallback(async (event) => {
        if (hasReminder(event.id)) {
            removeReminder(event.id);
            return false;
        } else {
            return await setReminder(event);
        }
    }, [hasReminder, removeReminder, setReminder]);

    // Check for due reminders
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();

            Object.values(reminders).forEach(reminder => {
                if (reminder.notified) return;

                const reminderTime = new Date(reminder.reminderTime);

                if (now >= reminderTime) {
                    // Show notification
                    if (permission === 'granted') {
                        new Notification('Doha Events Reminder', {
                            body: `${reminder.eventTitle} starts in ${reminder.hoursBefore} hour(s)!`,
                            icon: '/icons/icon-192.png',
                            tag: reminder.eventId
                        });
                    }

                    // Mark as notified
                    setReminders(prev => ({
                        ...prev,
                        [reminder.eventId]: {
                            ...prev[reminder.eventId],
                            notified: true
                        }
                    }));
                }
            });
        };

        // Check every minute
        const interval = setInterval(checkReminders, 60000);
        checkReminders(); // Check immediately

        return () => clearInterval(interval);
    }, [reminders, permission]);

    return {
        reminders,
        permission,
        requestPermission,
        setReminder,
        removeReminder,
        hasReminder,
        toggleReminder
    };
}

export default useReminders;
