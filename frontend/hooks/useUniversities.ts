import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { University } from '../types';

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/universities')
      .then(res => setUniversities(res.data))
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { universities, loading, refetch: fetch };
}
