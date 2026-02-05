import { useState, useCallback, useEffect } from 'react';
import api from '../../../../lib/api';

/**
 * Hook for fetching and managing condition mindmap data
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
