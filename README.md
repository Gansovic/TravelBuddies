# TravelBuddies 🌍

> A private, group travel planning platform for creating, sharing, and preserving your travel memories

TravelBuddies is a comprehensive travel companion app that lets you plan trips, capture memories, manage expenses, and collaborate with fellow travelers in real-time. Built with modern web technologies and designed for seamless mobile and desktop experiences.

![TravelBuddies Screenshot](https://via.placeholder.com/800x400/6366f1/ffffff?text=TravelBuddies+Screenshot)

## ✨ Features

### 📷 Unified Memories System
- **Photo & Video Capture**: Take photos directly in the app or upload from your device
- **Rich Content**: Add notes, voice recordings, and location data to your memories
- **Timeline Organization**: Automatically organized by date with travel statistics
- **Real-time Sync**: Share memories instantly with your travel companions
- **Smart Metadata**: Automatic location detection and reverse geocoding

### 🗓️ Trip Planning & Management
- **Collaborative Planning**: Plan itineraries together with your travel group
- **Trip Creation**: Easy trip setup with member invitations
- **Real-time Updates**: See changes as they happen across all devices
- **Trip Statistics**: Track your journey with distance, cities, and countries visited

### 💰 Expense Tracking
- **Multi-currency Support**: Handle expenses in different currencies
- **Smart Splitting**: Automatically calculate who owes what
- **Settlement Optimization**: Minimize the number of transactions needed
- **Receipt Management**: Attach photos of receipts to expenses

### 🗳️ Group Decision Making
- **Polls & Voting**: Make group decisions about activities and destinations
- **Activity Suggestions**: Discover and vote on things to do
- **Real-time Results**: See voting results update in real-time

### 👥 Member Management
- **Role-based Access**: Owners, admins, and regular members with different permissions
- **Invitation System**: Easily invite friends to join your trip
- **Privacy Controls**: Control what information is visible to different members

### 📊 Trip Analytics
- **Interactive Recap**: Beautiful summaries of your completed trips
- **Travel Statistics**: Distance traveled, places visited, memories created
- **Export Options**: Download your trip data and memories

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 9.6.0+
- **Docker** (for local Supabase)
- **Git**

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gansovic/TravelBuddies.git
   cd TravelBuddies
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start Supabase locally**
   ```bash
   supabase start
   ```

4. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

TravelBuddies is built as a modern, scalable monorepo application:

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Real-time**: Supabase Realtime for live collaboration
- **State Management**: TanStack Query for server state
- **File Storage**: Supabase Storage with CDN
- **Deployment**: Vercel (Frontend), Supabase (Backend)

### Monorepo Structure
```
TravelBuddies/
├── apps/
│   └── web/                 # Next.js frontend application
├── packages/
│   ├── ui/                  # Shared UI components
│   └── utils/               # Shared business logic and types
├── supabase/
│   ├── migrations/          # Database schema and migrations
│   └── functions/           # Edge Functions
└── docs/                    # Documentation
```

### Key Architectural Decisions

1. **Row Level Security (RLS)**: All data access is secured at the database level
2. **Type Safety**: End-to-end TypeScript with generated database types
3. **Real-time First**: Built for live collaboration from the ground up
4. **Mobile Responsive**: Progressive Web App with offline capabilities
5. **Monorepo Benefits**: Shared types and utilities across frontend and backend

## 📱 Core Functionality

### Memory Creation Flow
```typescript
// Create a memory with photo
const memory = await momentService.createMoment({
  trip_id: 'trip-uuid',
  type: 'photo',
  title: 'Beautiful sunset',
  description: 'Amazing sunset from the beach',
  media_file: photoFile,
  latitude: 40.7128,
  longitude: -74.0060,
  is_private: false
});
```

### Real-time Collaboration
```typescript
// Subscribe to trip updates
const unsubscribe = supabase
  .channel(`trip:${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'moments'
  }, handleNewMemory)
  .subscribe();
```

## 🛡️ Security & Privacy

- **Row Level Security**: Database-level access control
- **Private Trips**: Full privacy controls for sensitive travel data
- **Secure Storage**: Encrypted file storage with access controls
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Validation**: Input validation and sanitization throughout

## 📂 API Reference

### Memories API
```bash
# Create memory
POST /api/trip/{tripId}/memories

# Get trip timeline
GET /api/trip/{tripId}/memories

# Delete memory
DELETE /api/trip/{tripId}/memories/{momentId}/delete
```

### Trips API
```bash
# Create trip
POST /api/trip/create

# Get user trips
GET /api/trips?user_id={userId}

# Delete trip
DELETE /api/trip/{tripId}/delete
```

## 🎨 UI Components

TravelBuddies includes a comprehensive design system:

- **Memory Cards**: Rich media cards with actions and metadata
- **Timeline Views**: Organized by date with statistics
- **Confirmation Dialogs**: User-friendly confirmation for destructive actions
- **Loading States**: Smooth loading experiences throughout
- **Mobile Optimized**: Touch-friendly interfaces for mobile devices

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific package tests
pnpm -F utils test
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Deploy to production
vercel --prod
```

### Database (Supabase)
```bash
# Deploy migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

## 📖 Documentation

- [MVP Specification](./travelbuddies-mvp-spec.md) - Complete product requirements
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and architecture notes
- [API Documentation](./docs/api.md) - Complete API reference
- [Component Library](./docs/components.md) - UI component documentation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style
- We use TypeScript throughout
- Prettier for code formatting
- ESLint for code quality
- Conventional Commits for commit messages

## 🐛 Known Issues & Limitations

- **Local Storage**: Some features require local storage (offline mode coming soon)
- **Mobile Camera**: Camera capture works best in modern browsers
- **Large Files**: File uploads are limited to 50MB per file
- **Concurrent Editing**: Real-time editing conflicts are handled with last-write-wins

## 🚧 Roadmap

### Short Term (Next Release)
- [ ] Offline mode with sync when online
- [ ] Push notifications for trip updates
- [ ] Enhanced photo editing tools
- [ ] Bulk photo upload
- [ ] Trip templates and sharing

### Medium Term
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and insights
- [ ] Integration with booking platforms
- [ ] AI-powered trip suggestions
- [ ] Multi-language support

### Long Term
- [ ] Public trip sharing
- [ ] Travel community features
- [ ] Marketplace for local guides
- [ ] Advanced collaboration tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Next.js](https://nextjs.org) for the excellent React framework  
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [OpenStreetMap](https://openstreetmap.org) for free and open mapping data
- [Vercel](https://vercel.com) for seamless deployment and hosting

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Gansovic/TravelBuddies/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gansovic/TravelBuddies/discussions)
- **Email**: support@travelbuddies.app (coming soon)

---

**Happy Traveling! 🎒✈️**

*Built with ❤️ by the TravelBuddies team*