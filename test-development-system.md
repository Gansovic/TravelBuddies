# TravelBuddies Development Testing System

## Overview
This comprehensive testing system makes it easy to test the app as different users and scenarios without manual database manipulation.

## Features

### 🛠️ Developer Testing Panel
- **Access**: Click the "🛠️" button in the bottom-right corner (development only)
- **User Switching**: Switch between 5 test users with different roles
- **Time Simulation**: Test historical scenarios and different time periods
- **Database Management**: Reset and seed test data with one click

### 👥 Test Users
1. **Alice Smith** (Trip Creator) - `a0f45e63-a83b-43fa-ac95-60721c0ce39d`
2. **Bob Johnson** (Active Member) - `b1f45e63-a83b-43fa-ac95-60721c0ce39d`
3. **Carol Davis** (Trip Member) - `c2f45e63-a83b-43fa-ac95-60721c0ce39d`
4. **David Wilson** (Weekend Trip Owner) - `d3f45e63-a83b-43fa-ac95-60721c0ce39d`
5. **Emma Brown** (New User) - `e4f45e63-a83b-43fa-ac95-60721c0ce39d`

### 🗓️ Test Trips
1. **European Adventure** - Multi-user trip with Alice, Bob, Carol
2. **Tokyo Summer Trip** - Alice and Bob
3. **Weekend Getaway** - Bob (owner), Carol, David

### ⏰ Time Machine
- Current Time
- Yesterday/Last Week/Last Month
- Trip Time (July 2024) - During European Adventure
- Tokyo Trip (August 2024) - During Tokyo trip

### 🗄️ Database Management
- **Seed Database**: Populate with comprehensive test data
- **Reset Database**: Clear all test data
- **Quick Links**: Jump to different sections of the app

## Testing Workflows

### Multi-User Scenario Testing
1. Seed the database with test data
2. Switch to Alice (trip creator)
3. Navigate to European Adventure trip
4. Create a memory or poll
5. Switch to Bob (member)
6. See the content from Bob's perspective
7. React or respond as Bob

### Historical Data Testing
1. Set time to "Trip Time (July 2024)"
2. View memories from that time period
3. Test how "recent" vs "old" content appears
4. Switch to current time to see difference

### User Permission Testing
1. Switch to Bob (member)
2. Try to delete Alice's content (should fail)
3. Switch to Alice (owner)
4. Try to manage trip settings (should work)

## API Endpoints (Development Only)
- `POST /api/dev/seed-database` - Populate test data
- `POST /api/dev/reset-database` - Clear all data

## Testing Status ✅

### ✅ What's Working
1. **Developer Panel**: Displays in bottom-right, toggles open/closed
2. **User Switching**: Persists across page reloads
3. **Time Simulation**: Time context available throughout app
4. **Database APIs**: Seed and reset work correctly
5. **Test Data**: 5 users, 3 trips, 3 memories, 7 memberships created

### 🔧 Integration Needed
The system is ready for integration with existing app components:
- Any component using `useUser()` will automatically respect user switching
- Any component using `useTime()` will respect time simulation
- Components can check `isSimulating` to show special UI for test scenarios

## Usage Example

```typescript
import { useUser } from '../lib/userContext';
import { useTime, timeUtils } from '../lib/timeContext';

function MyComponent() {
  const { user } = useUser();
  const { currentTime, isSimulating } = useTime();
  
  return (
    <div>
      <p>Current user: {user?.name}</p>
      <p>Current time: {timeUtils.formatTime(currentTime)}</p>
      {isSimulating && <p>⏰ Time simulation active</p>}
    </div>
  );
}
```

## Next Steps
1. ✅ Basic testing system is complete and functional
2. Add test data for more complex scenarios (polls, reactions, expenses)
3. Create testing scenarios documentation
4. Add automated testing helpers