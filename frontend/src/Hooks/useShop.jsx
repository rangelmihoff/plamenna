import { useState, useEffect } from 'react';
import { useQuery } from '../contexts/QueryProvider';

export function useShop() {
  const { query } = useQuery();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const data = await query('/api/shop');
        if (data.success) {
          setShop(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [query]);

  const updateShopSettings = async (settings) => {
    try {
      const data = await query('/api/shop/settings', 'PUT', settings);
      if (data.success) {
        setShop(prev => ({ ...prev, ...data.data }));
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    shop,
    loading,
    error,
    updateShopSettings,
    refetch: () => {
      setLoading(true);
      setError(null);
    }
  };
}