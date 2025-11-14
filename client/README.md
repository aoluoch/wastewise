# WasteWise Frontend

A modern React TypeScript frontend for the WasteWise waste management system.

## Features

- 🚀 **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- 🎨 **Beautiful UI**: Responsive design with dark mode support
- 🔐 **Authentication**: Role-based access control (Admin, Collector, Resident)
- 🗺️ **Interactive Maps**: Location selection and waste tracking
- 📱 **Mobile First**: Responsive design for all devices
- 🔄 **Real-time Updates**: Socket.io integration for live updates
- 📊 **Data Management**: React Query for efficient data fetching
- 🎯 **Type Safety**: Full TypeScript support with strict typing

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query, Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Maps**: Mapbox (configurable)
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   ├── layouts/            # Role-based layouts
│   ├── pages/              # Route pages
│   │   ├── auth/           # Authentication pages
│   │   ├── admin/          # Admin pages
│   │   ├── collector/      # Collector pages
│   │   └── resident/       # Resident pages
│   ├── routes/             # Routing configuration
│   ├── context/            # React contexts
│   ├── store/              # State management
│   ├── api/                # API client and methods
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp env.example .env.local
```

3. Update environment variables in `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Development

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## Features by Role

### Resident

- Report waste issues with photos and location
- View pickup schedules
- Track report status
- Receive notifications

### Collector

- View assigned tasks
- Update task status
- Chat with residents
- Navigate to pickup locations

### Admin

- Manage all reports
- User management
- Analytics dashboard
- System configuration

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Environment Variables

| Variable            | Description          | Default                     |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API URL      | `http://localhost:3000/api` |
| `VITE_SOCKET_URL`   | Socket.io server URL | `http://localhost:3001`     |
| `VITE_MAPBOX_TOKEN` | Mapbox access token  | Required for maps           |

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Write meaningful commit messages
4. Test your changes thoroughly

## License

This project is part of the WasteWise waste management system.
