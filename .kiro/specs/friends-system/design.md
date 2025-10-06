# Friends System Design Document

## Overview

The friends system will extend the existing daily games application to allow users to connect with specific friends rather than seeing all users' scores. The system will implement a bidirectional friendship model with friend requests, notifications, and filtered score views.

## Architecture

### Database Schema Extensions

The system will add two new database tables to support friendships and friend requests:

1. **friendships** - Stores confirmed bidirectional friendships
2. **friend_requests** - Stores pending friend requests

### Core Components

1. **Friend Management Service** - Handles friend request logic and friendship operations
2. **Notification System** - Manages friend request notifications and badge counts
3. **Score Filtering Service** - Filters score displays based on friendship status
4. **Profile Page Extensions** - UI components for friend management

## Components and Interfaces

### Database Schema

#### Friendships Table
```typescript
const friendships = pgTable("friendships", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  friendId: text("friendId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
```

#### Friend Requests Table
```typescript
const friendRequests = pgTable("friend_requests", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  senderId: text("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiverId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

### API Endpoints

#### Friend Request Management
- `POST /api/friends/request` - Send friend request by email
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `DELETE /api/friends/cancel` - Cancel sent friend request
- `DELETE /api/friends/remove` - Remove existing friendship

#### Friend Data Retrieval
- `GET /api/friends` - Get user's friends list
- `GET /api/friends/requests/incoming` - Get pending incoming requests
- `GET /api/friends/requests/outgoing` - Get pending outgoing requests
- `GET /api/friends/requests/count` - Get count of pending incoming requests

### UI Components

#### Profile Page Components
1. **AddFriendForm** - Email input and submit for sending friend requests
2. **FriendRequestsList** - Display incoming friend requests with accept/decline actions
3. **SentRequestsList** - Display outgoing pending requests with cancel option
4. **FriendsList** - Display current friends with remove option

#### Navigation Components
1. **NotificationBadge** - Red badge showing pending friend request count
2. **Enhanced Profile Link** - Profile navigation item with notification badge

### Service Layer

#### FriendService
```typescript
interface FriendService {
  sendFriendRequest(senderEmail: string, receiverEmail: string): Promise<void>;
  acceptFriendRequest(requestId: string, userId: string): Promise<void>;
  declineFriendRequest(requestId: string, userId: string): Promise<void>;
  cancelFriendRequest(requestId: string, userId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  getIncomingRequests(userId: string): Promise<FriendRequest[]>;
  getOutgoingRequests(userId: string): Promise<FriendRequest[]>;
  getPendingRequestCount(userId: string): Promise<number>;
}
```

#### ScoreFilterService
```typescript
interface ScoreFilterService {
  getFilteredScores(userId: string, options?: QueryOptions): Promise<ScoreEntry[]>;
  getUserFriendIds(userId: string): Promise<string[]>;
  shouldShowAllUsers(userId: string): Promise<boolean>;
}
```

## Data Models

### Extended User Relations
```typescript
export const usersRelations = relations(users, ({ many }) => ({
  gameScoreEntries: many(gameScoreEntries),
  sentFriendRequests: many(friendRequests, { relationName: "sender" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  friendships: many(friendships, { relationName: "user" }),
  friendOf: many(friendships, { relationName: "friend" }),
}));
```

### Friend Request Model
```typescript
type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
  sender: User;
  receiver: User;
};
```

### Friendship Model
```typescript
type Friendship = {
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
  user: User;
  friend: User;
};
```

## Error Handling

### Validation Errors
- Invalid email format
- User not found
- Self-friendship attempts
- Duplicate friend requests
- Already existing friendships

### Database Errors
- Constraint violations
- Transaction failures
- Connection timeouts

### API Error Responses
```typescript
type ApiError = {
  error: string;
  message: string;
  code: number;
};
```

### Error Handling Strategy
1. **Client-side validation** - Immediate feedback for invalid inputs
2. **Server-side validation** - Comprehensive validation with detailed error messages
3. **Database constraints** - Prevent invalid data states
4. **Transaction rollbacks** - Ensure data consistency
5. **User-friendly messages** - Clear error communication to users

## Testing Strategy

### Unit Tests
- Friend service methods
- Score filtering logic
- Validation functions
- Database operations

### Integration Tests
- API endpoint functionality
- Database transaction integrity
- Authentication and authorization
- Friend request workflow end-to-end

### Component Tests
- Profile page friend management components
- Notification badge behavior
- Form validation and submission
- Score list filtering

### Database Tests
- Schema constraints
- Relationship integrity
- Query performance
- Migration scripts

## Implementation Considerations

### Performance Optimizations
1. **Database Indexing** - Index on userId, friendId, and status fields
2. **Query Optimization** - Efficient joins for friend-filtered score queries
3. **Caching Strategy** - Cache friend lists and notification counts
4. **Pagination** - Implement pagination for large friend lists

### Security Considerations
1. **Authorization** - Ensure users can only manage their own friendships
2. **Input Validation** - Sanitize all user inputs
3. **Rate Limiting** - Prevent spam friend requests
4. **CSRF Protection** - Secure form submissions

### User Experience
1. **Real-time Updates** - Consider WebSocket for live notifications
2. **Loading States** - Show loading indicators during async operations
3. **Optimistic Updates** - Update UI immediately for better responsiveness
4. **Confirmation Dialogs** - Confirm destructive actions like removing friends

### Migration Strategy
1. **Backward Compatibility** - Ensure existing users see all scores until they have friends
2. **Data Migration** - No existing data migration needed
3. **Feature Rollout** - Gradual rollout with feature flags if needed