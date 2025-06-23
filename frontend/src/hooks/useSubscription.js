import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionRes, usageRes] = await Promise.all([
        api.request('/api/subscriptions/status'),
        api.request('/api/subscriptions/usage')
      ]);

      setSubscription(subscriptionRes);
      setUsage(usageRes);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  const checkLimits = (type, amount = 1) => {
    if (!subscription || !usage) return false;

    switch (type) {
      case 'aiQueries':
        return (usage.aiQueries + amount) <= subscription.limits.aiQueries;
      case 'products':
        return (usage.products + amount) <= subscription.limits.products;
      default:
        return false;
    }
  };

  const getRemainingQuota = (type) => {
    if (!subscription || !usage) return 0;

    switch (type) {
      case 'aiQueries':
        return subscription.limits.aiQueries - usage.aiQueries;
      case 'products':
        return subscription.limits.products - usage.products;
      default:
        return 0;
    }
  };

  const getUsagePercentage = (type) => {
    if (!subscription || !usage) return 0;

    switch (type) {
      case 'aiQueries':
        return Math.round((usage.aiQueries / subscription.limits.aiQueries) * 100);
      case 'products':
        return Math.round((usage.products / subscription.limits.products) * 100);
      default:
        return 0;
    }
  };

  const isTrialActive = () => {
    return subscription?.trial_active && new Date(subscription.trial_end) > new Date();
  };

  const getTrialDaysLeft = () => {
    if (!isTrialActive()) return 0;
    return Math.ceil((new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const value = {
    subscription,
    usage,
    loading,
    refreshSubscription,
    checkLimits,
    getRemainingQuota,
    getUsagePercentage,
    isTrialActive,
    getTrialDaysLeft
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => useContext(SubscriptionContext);

export const useSubscription = () => {
  return useSubscriptionContext();
};