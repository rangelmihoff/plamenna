import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [shopStatus, setShopStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchShopStatus = async () => {
        try {
            const response = await axios.get('/api/shop-status');
            setShopStatus(response.data);
        } catch (error) {
            console.error("Failed to fetch shop status:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShopStatus();
    }, []);

    return (
        <AppContext.Provider value={{ shopStatus, loading, refetchStatus: fetchShopStatus }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);

