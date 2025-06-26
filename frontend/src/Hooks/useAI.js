import { useState, useCallback } from 'react';
import { useQuery } from '../contexts/QueryProvider';

export function useAI() {
  const { mutation } = useQuery();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const queryAI = useCallback(async (prompt, provider = 'openai') => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await mutation('/api/ai/query', 'POST', { query: prompt, provider });
      return response.data;
    } catch (err) {
      setError(err.message || 'AI request failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [mutation]);

  const optimizeSEO = useCallback(async (productId, fields) => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await mutation(`/api/products/${productId}/optimize`, 'POST', { fields });
      return response.data;
    } catch (err) {
      setError(err.message || 'SEO optimization failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [mutation]);

  return {
    queryAI,
    optimizeSEO,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
}