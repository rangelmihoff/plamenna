import React, { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription, usage, setUsage }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => useContext(SubscriptionContext); 