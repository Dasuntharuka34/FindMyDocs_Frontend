import { useState } from 'react';

export const useRequestFilters = (
  initialSortField = 'submittedDate',
  initialSortOrder = 'desc',
  searchFields = ['studentName', 'reason', 'status', 'type']
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(initialSortField);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  const applyFiltersAndSorting = (items) => {
    let filteredItems = items.filter((item) => {
      const searchContent = searchFields
        .map(field => item[field] || '')
        .join(' ')
        .toLowerCase();
      return searchContent.includes(searchTerm.toLowerCase());
    });

    return filteredItems.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField.includes('Date')) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    applyFiltersAndSorting,
  };
};
