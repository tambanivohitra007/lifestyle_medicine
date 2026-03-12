import { useState, useCallback, useEffect } from 'react';
import api from '../../../../lib/api';

/**
 * Hook for fetching and managing condition mindmap data from the API.
 * Makes a GET request to /conditions/:id/mindmap and provides loading/error states
 * with a refetch capability.
 *
 * @param {string} conditionId - UUID of the condition to fetch mindmap data for
 * @returns {{
 *   data: Object|null,       - Raw API response data (condition, sections, branches, meta)
 *   loading: boolean,        - Whether the request is in progress
 *   error: string|null,      - Error message if the request failed
 *   refetch: Function,       - Function to re-fetch the data
 *   condition: Object|null,  - Shortcut to data.condition
 *   branches: Object|null,   - Shortcut to data.branches
 *   meta: Object|null        - Shortcut to data.meta (counts of interventions, recipes, etc.)
 * }}
 */
export function useConditionMindmap(conditionId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMindmap = useCallback(async () => {
    if (!conditionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/conditions/${conditionId}/mindmap`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch mindmap data:', err);
      setError(err.response?.data?.message || 'Failed to load mindmap');
    } finally {
      setLoading(false);
    }
  }, [conditionId]);

  useEffect(() => {
    fetchMindmap();
  }, [fetchMindmap]);

  const refetch = useCallback(() => {
    fetchMindmap();
  }, [fetchMindmap]);

  return {
    data,
    loading,
    error,
    refetch,
    condition: data?.condition,
    branches: data?.branches,
    meta: data?.meta,
  };
}

export default useConditionMindmap;
