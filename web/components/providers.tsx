'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  // Use a placeholder app ID for demo purposes
  // Get your own from https://dashboard.privy.io
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl';

  // Only render Privy if we have a valid-looking app ID
  if (!appId || appId === 'your_privy_app_id_here') {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#84cc16',
          logo: 'https://your-logo-url.com/logo.png',
        },
        loginMethods: ['wallet', 'email', 'google'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
