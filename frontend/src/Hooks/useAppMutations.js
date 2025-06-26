import { useCallback } from 'react';
import { useQuery } from '../contexts/QueryProvider';

export function useAppMutations() {
  const { mutation } = useQuery();

  const createSubscription = useCallback(async (planName) => {
    return await mutation('/api/subscription', 'POST', { planName });
  }, [mutation]);

  const updateProduct = useCallback(async (productId, updates) => {
    return await mutation(`/api/products/${productId}`, 'PUT', updates);
  }, [mutation]);

  const syncProducts = useCallback(async () => {
    return await mutation('/api/products/sync', 'POST');
  }, [mutation]);

  const bulkOptimize = useCallback(async (productIds, fields) => {
    return await mutation('/api/products/bulk-optimize', 'POST', { 
      productIds, 
      fields 
    });
  }, [mutation]);

  return {
    createSubscription,
    updateProduct,
    syncProducts,
    bulkOptimize
  };
}