// Category utilities and color mappings

export const CATEGORIES = {
  free: { name: 'Free', color: '#10B981', icon: '🆓' },
  sports: { name: 'Sports', color: '#3B82F6', icon: '⚽' },
  music: { name: 'Music', color: '#8B5CF6', icon: '🎵' },
  arts: { name: 'Arts', color: '#F59E0B', icon: '🎭' },
  food: { name: 'Food', color: '#EF4444', icon: '🍽️' },
  festival: { name: 'Festival', color: '#EC4899', icon: '🎪' },
  other: { name: 'Other', color: '#6B7280', icon: '📅' }
};

export const getCategoryColor = (category) => {
  return CATEGORIES[category]?.color || CATEGORIES.other.color;
};

export const getCategoryName = (category) => {
  return CATEGORIES[category]?.name || 'Other';
};

export const getCategoryIcon = (category) => {
  return CATEGORIES[category]?.icon || '📅';
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Format date range
export const formatDateRange = (startDate, endDate) => {
  if (!endDate) return formatDate(startDate);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start.getTime() === end.getTime()) {
    return formatDate(startDate);
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Check if event is happening today
export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Check if event is ongoing
export const isOngoing = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  if (!endDate) {
    return start.getTime() === today.getTime();
  }
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return today >= start && today <= end;
};

// Check if event is on a specific date
export const isOnDate = (event, date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(event.date);
  startDate.setHours(0, 0, 0, 0);
  
  if (!event.endDate) {
    return startDate.getTime() === targetDate.getTime();
  }
  
  const endDate = new Date(event.endDate);
  endDate.setHours(23, 59, 59, 999);
  
  return targetDate >= startDate && targetDate <= endDate;
};

// Get events for a specific date
export const getEventsForDate = (events, date) => {
  return events.filter(event => isOnDate(event, date));
};

// Sort events by date
export const sortEventsByDate = (events) => {
  return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Filter events
export const filterEvents = (events, filters) => {
  let filtered = [...events];
  
  // Filter by category
  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'free') {
      filtered = filtered.filter(e => e.isFree);
    } else {
      filtered = filtered.filter(e => e.category === filters.category);
    }
  }
  
  // Filter by search query
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query)
    );
  }
  
  // Filter by date range
  if (filters.startDate) {
    filtered = filtered.filter(e => {
      const eventEnd = e.endDate ? new Date(e.endDate) : new Date(e.date);
      return eventEnd >= new Date(filters.startDate);
    });
  }
  
  if (filters.endDate) {
    filtered = filtered.filter(e => {
      const eventStart = new Date(e.date);
      return eventStart <= new Date(filters.endDate);
    });
  }
  
  return filtered;
};
