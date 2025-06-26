import { TopBar as ShopifyTopBar, useAppBridge } from '@shopify/app-bridge-react';
import { useRouter } from 'next/router';

export function TopBar() {
  const router = useRouter();
  const app = useAppBridge();

  const userMenuMarkup = (
    <TopBar.UserMenu
      name="Admin"
      initials="A"
      onAction={() => {
        // Handle logout
        router.push('/login');
      }}
    />
  );

  return (
    <ShopifyTopBar
      userMenu={userMenuMarkup}
    />
  );
}