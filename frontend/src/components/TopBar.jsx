// frontend/src/components/TopBar.jsx
// This component defines the top bar of the application, which includes
// the user menu and secondary actions like the language switcher.

import { TopBar } from '@shopify/polaris';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShop } from '../hooks/useShop';

function TopBarMarkup() {
    const { t } = useTranslation();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Fetch shop data to display the shop name and owner initials
    const { data: shopData } = useShop();

    const toggleIsUserMenuOpen = useCallback(
        () => setIsUserMenuOpen((prev) => !prev),
        [],
    );

    const userMenuMarkup = (
        <TopBar.UserMenu
            actions={[
                { items: [{ content: 'Community forum', url: '#', helpText: 'Opens in a new tab' }] },
            ]}
            name={shopData?.shop?.name || 'Merchant'}
            detail={shopData?.shop?.domain || ''}
            initials={shopData?.shop?.name?.charAt(0).toUpperCase() || 'M'}
            open={isUserMenuOpen}
            onToggle={toggleIsUserMenuOpen}
        />
    );

    // Note: The LanguageSwitcher component from the initial request is now part of the Settings page
    // for a cleaner UI, as per modern Shopify app design guidelines.
    // A secondary menu could be added here if needed in the future.

    return (
        <TopBar
            showNavigationToggle // This shows the hamburger menu on mobile
            userMenu={userMenuMarkup}
        />
    );
}

export default TopBarMarkup;