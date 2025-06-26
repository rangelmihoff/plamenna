import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '../contexts/QueryProvider';

export function useProducts() {
  const { query } = useQuery();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sort: '-createdAt'
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { page, limit } = pagination;
      const { search, sort } = filters;
      
      const data = await query(
        `/api/products?page=${page}&limit=${limit}&search=${search}&sort=${sort}`
      );

      setProducts(data.data);
      setPagination(prev => ({
        ...prev,
        pages: data.pagination.pages,
        total: data.pagination.total
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setSort = useCallback((sort) => {
    setFilters(prev => ({ ...prev, sort }));
  }, []);

  return {
    products,
    pagination,
    loading,
    error,
    filters,
    setPage,
    setLimit,
    setSearch,
    setSort,
    refetch: fetchProducts
  };
}