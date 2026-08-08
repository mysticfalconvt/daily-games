# Score Interactions Design Document

## Overview

The Score Interactions feature adds social engagement capabilities to the existing gaming platform by allowing users to comment on and react to score entries with emojis. This system integrates with the existing privacy settings and friendship system to ensure appropriate access control while providing real-time interactive experiences.

## Architecture

### High-Level Architecture

The system follows the existing Next.js App Router pattern with:

- **Database Layer**: New tables for comments and reactions with proper relationships
- **Service Layer**: New `ScoreInteractionService` following existing patterns
- **API Layer**: RESTful endpoints for CRUD operations on comments and reactions
- **Component Layer**: Enhanced score cards with interactive comment and reaction components
- **Real-time Layer**: WebSocket or Server-Sent Events for live updates

### Data Flow

1. **User Interaction**: User clicks emoji or submits comment
2. **API Request**: Frontend sends request to appropriate API endpoint
3. **Authorization**: Server validates user permissions based on privacy settings
4. **Database Update**: Service layer updates database with new interaction
5. **Real-time Broadcast**: System notifies all connected clients of the change
6. **UI Update**: All viewing clients update their displays immediately

## Components and Interfaces

### Database Schema

#### Comments Table

```sql
CREATE TABLE score_comments (
  id TEXT PRIMARY KEY DEFAULT uuid_v4(),
  score_id TEXT NOT NULL REFERENCES gameScore_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Reactions Table

```sql
CREATE TABLE score_reactions (
  id TEXT PRIMARY KEY DEFAULT uuid_v4(),
  score_id TEXT NOT NULL REFERENCES gameScore_entries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  emoji_type TEXT NOT NULL CHECK (emoji_type IN ('👍', '🔥', '😮', '😂', '❤️', '🎉')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(score_id, user_id, emoji_type)
);
```

### TypeScript Interfaces

```typescript
// Core data types
interface ScoreComment {
  id: string;
  scoreId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string;
  };
}

interface ScoreReaction {
  id: string;
  scoreId: string;
  userId: string;
  emojiType: EmojiType;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string;
  };
}

type EmojiType = "👍" | "🔥" | "😮" | "😂" | "❤️" | "🎉";

// Aggregated data for UI
interface ScoreInteractions {
  comments: ScoreComment[];
  reactions: {
    [K in EmojiType]: {
      count: number;
      users: Array<{ id: string; name: string | null }>;
      userHasReacted: boolean;
    };
  };
}

// API request/response types
interface CreateCommentRequest {
  scoreId: string;
  content: string;
}

interface ToggleReactionRequest {
  scoreId: string;
  emojiType: EmojiType;
}
```

### Service Layer

#### ScoreInteractionService

```typescript
export class ScoreInteractionService {
  // Comment operations
  static async createComment(
    userId: string,
    scoreId: string,
    content: string
  ): Promise<ScoreComment>;
  static async deleteComment(userId: string, commentId: string): Promise<void>;
  static async getCommentsForScore(scoreId: string): Promise<ScoreComment[]>;

  // Reaction operations
  static async toggleReaction(
    userId: string,
    scoreId: string,
    emojiType: EmojiType
  ): Promise<void>;
  static async getReactionsForScore(scoreId: string): Promise<ScoreReaction[]>;
  static async getReactionSummary(
    scoreId: string,
    currentUserId?: string
  ): Promise<ReactionSummary>;

  // Privacy and permissions
  static async canUserInteractWithScore(
    userId: string,
    scoreId: string
  ): Promise<boolean>;
  static async getInteractionsForScore(
    scoreId: string,
    currentUserId?: string
  ): Promise<ScoreInteractions>;
}
```

### API Endpoints

#### Comments

- `POST /api/scores/[scoreId]/comments` - Create comment
- `DELETE /api/scores/comments/[commentId]` - Delete own comment
- `GET /api/scores/[scoreId]/comments` - Get comments for score

#### Reactions

- `POST /api/scores/[scoreId]/reactions` - Toggle reaction
- `GET /api/scores/[scoreId]/reactions` - Get reactions for score

#### Combined

- `GET /api/scores/[scoreId]/interactions` - Get all interactions for score

### Component Architecture

#### Enhanced ScoreCardList Component

- Integrates new `ScoreInteractions` component
- Maintains existing score display logic
- Passes interaction data to child components

#### New Components

**ScoreInteractions Component**

```typescript
interface ScoreInteractionsProps {
  scoreId: string;
  scoreOwnerId: string;
  currentUserId: string;
  initialInteractions?: ScoreInteractions;
}
```

**CommentSection Component**

- Displays existing comments with user info and timestamps
- Provides comment input form with character counter
- Handles comment submission and deletion
- Shows loading states and error handling

**ReactionBar Component**

- Displays emoji buttons with counts
- Highlights user's current reactions
- Shows reaction tooltips on hover
- Handles reaction toggling with optimistic updates

**ReactionTooltip Component**

- Shows list of users who reacted with specific emoji
- Triggered on hover over reaction counts

## Data Models

### Database Relationships

```typescript
// Enhanced gameScoreEntries relations
export const gameScoreEntriesRelations = relations(
  gameScoreEntries,
  ({ one, many }) => ({
    user: one(users, {
      fields: [gameScoreEntries.userId],
      references: [users.id],
    }),
    comments: many(scoreComments),
    reactions: many(scoreReactions),
  })
);

// New scoreComments relations
export const scoreCommentsRelations = relations(scoreComments, ({ one }) => ({
  score: one(gameScoreEntries, {
    fields: [scoreComments.scoreId],
    references: [gameScoreEntries.id],
  }),
  user: one(users, {
    fields: [scoreComments.userId],
    references: [users.id],
  }),
}));

// New scoreReactions relations
export const scoreReactionsRelations = relations(scoreReactions, ({ one }) => ({
  score: one(gameScoreEntries, {
    fields: [scoreReactions.scoreId],
    references: [gameScoreEntries.id],
  }),
  user: one(users, {
    fields: [scoreReactions.userId],
    references: [users.id],
  }),
}));
```

### Privacy Integration

The system leverages existing privacy logic:

- Uses `users.isPrivate` field to determine interaction permissions
- Integrates with `FriendService` to check friendship status
- Follows same patterns as score visibility in `ScoreFilterService`

## Error Handling

### Client-Side Error Handling

- **Network Errors**: Show retry buttons and offline indicators
- **Validation Errors**: Display inline error messages for invalid comments
- **Permission Errors**: Show appropriate messages when users can't interact
- **Rate Limiting**: Implement client-side debouncing for rapid interactions

### Server-Side Error Handling

- **Authentication**: Return 401 for unauthenticated requests
- **Authorization**: Return 403 for privacy violations
- **Validation**: Return 400 for invalid input with specific error messages
- **Not Found**: Return 404 for non-existent scores or comments
- **Database Errors**: Log errors and return generic 500 responses

### Error Recovery

- **Optimistic Updates**: Revert UI changes on API failures
- **Retry Logic**: Automatic retry for transient network failures
- **Graceful Degradation**: Show static content when real-time features fail

## Testing Strategy

### Unit Tests

- **Service Layer**: Test all ScoreInteractionService methods with various scenarios
- **API Routes**: Test authentication, authorization, and business logic
- **Components**: Test user interactions, state management, and error handling
- **Utilities**: Test privacy checking and data transformation functions

### Integration Tests

- **Database Operations**: Test complex queries and transactions
- **API Workflows**: Test complete comment and reaction workflows
- **Privacy Integration**: Test interaction permissions with various user relationships
- **Real-time Features**: Test WebSocket connections and message broadcasting

### End-to-End Tests

- **Comment Workflows**: Test complete comment creation, display, and deletion
- **Reaction Workflows**: Test emoji reactions and count updates
- **Privacy Scenarios**: Test interactions between friends, strangers, and private users
- **Real-time Updates**: Test live updates across multiple browser sessions

### Performance Tests

- **Database Queries**: Test query performance with large datasets
- **API Response Times**: Test response times under various loads
- **Real-time Scalability**: Test WebSocket performance with many concurrent users
- **Component Rendering**: Test UI performance with many comments and reactions

## Real-time Implementation

### Technology Choice

Use **Server-Sent Events (SSE)** for real-time updates:

- Simpler than WebSockets for one-way communication
- Better browser support and automatic reconnection
- Easier to implement with existing Next.js infrastructure
- Sufficient for the interaction update use case

### Implementation Details

- **Event Stream Endpoint**: `/api/scores/[scoreId]/events`
- **Event Types**: `comment-added`, `comment-deleted`, `reaction-updated`
- **Client Connection**: Establish SSE connection when viewing score cards
- **Event Broadcasting**: Notify all connected clients when interactions change

### Fallback Strategy

- **Polling Fallback**: Use periodic API calls if SSE fails
- **Manual Refresh**: Provide refresh button for manual updates
- **Offline Handling**: Queue interactions when offline, sync when reconnected
