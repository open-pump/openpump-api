# OpenPump Frontend

Beautiful, modern frontend for OpenPump API with Privy authentication.

## Features

- **OpenRouter-Inspired Design** - Clean, minimal aesthetic matching OpenRouter
- **Privy Authentication** - Wallet, email, and social login
- **Real-Time Token Data** - Live token prices, quality scores, and categories
- **Responsive Design** - Works on desktop and mobile
- **Featured Tokens** - Showcase of high-quality tokens
- **Search Functionality** - Search by address, name, or symbol

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Privy** - Authentication and wallet connection
- **Lucide React** - Beautiful icons

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env.local` with your Privy App ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

Get your Privy App ID from: https://dashboard.privy.io

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

## Privy Setup

1. Go to [https://dashboard.privy.io](https://dashboard.privy.io)
2. Create a new app
3. Copy your App ID
4. Add it to `.env.local`
5. Configure login methods (wallet, email, Google, etc.)

## Project Structure

```
web/
├── app/
│   ├── layout.tsx          # Root layout with Privy provider
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/
│   └── providers.tsx       # Privy configuration
├── public/                 # Static assets
├── .env.local             # Environment variables
└── package.json
```

## Customization

### Colors

Primary color is defined in `tailwind.config.ts`. Change `primary` colors to customize the theme:

```typescript
colors: {
  primary: {
    500: '#6366f1',  // Main accent color
    600: '#4f46e5',  // Hover state
    // ...
  }
}
```

### Privy Configuration

Update `components/providers.tsx` to customize authentication:

```typescript
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    appearance: {
      theme: 'light',
      accentColor: '#6366F1',
    },
    loginMethods: ['wallet', 'email', 'google'],
  }}
>
```

## Features to Add

- [ ] Dashboard page with API key management
- [ ] Tokens page with live data from API
- [ ] Rankings page showing top tokens
- [ ] User settings and preferences
- [ ] Dark mode support
- [ ] Token detail pages
- [ ] Real-time WebSocket updates

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

## API Integration

To connect to the OpenPump API, add the API URL to `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.openpump.io
```

Then fetch data in your components:

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/v1/tokens/${mint}`
);
const token = await response.json();
```

## Support

- **Documentation**: http://localhost:49729
- **API Reference**: See docs folder
- **Issues**: GitHub Issues

## License

MIT License - See LICENSE file
