// Този компонент е нужен за комуникация с Shopify Admin
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBridgeProvider } from '@shopify/app-bridge-react';

export function AppBridgeProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const history = useMemo(
        () => ({
            replace: (path) => {
                navigate(path, { replace: true });
            },
        }),
        [navigate]
    );

    const routerConfig = useMemo(() => ({ history, location }), [history, location]);

    // Конфигурацията на App Bridge
    const config = {
        apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || '2bc2b96aa1515eeda30ed377c41375d8', // Резервен ключ
        host: new URLSearchParams(location.search).get('host'),
        forceRedirect: true,
    };

    if (!config.host) {
        // Ако сме извън Shopify Admin, не рендираме Provider-a
        return <>{children}</>;
    }

    return (
        <Provider config={config} router={routerConfig}>
            {children}
        </Provider>
    );
}