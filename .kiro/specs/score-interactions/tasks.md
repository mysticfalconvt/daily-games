# Implementation Plan

- [x] 1. Set up database schema and core data models

  - Create score_comments and score_reactions table schemas using Drizzle ORM
  - Define TypeScript interfaces for ScoreComment, ScoreReaction, and related types
  - Set up database relations between new tables and existing gameScoreEntries and users tables
  - Create database migration files for the new tables
  - _Requirements: 1.1, 1.3, 2.1, 2.3_

- [x] 2. Implement core service layer for interactions

  - Create ScoreInteractionService class with comment CRUD operations
  - Implement reaction toggle and retrieval methods in ScoreInteractionService
  - Add privacy permission checking methods that integrate with existing friendship system
  - Create aggregation methods to combine comments and reactions for UI consumption
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 4.1, 4.2_

- [ ]\* 2.1 Write unit tests for ScoreInteractionService

  - Test comment creation, deletion, and retrieval methods
  - Test reaction toggling and aggregation logic
  - Test privacy permission checking with various user relationship scenarios
  - _Requirements: 1.1, 2.1, 4.1, 4.2_

- [x] 3. Create API endpoints for comment operations

  - Implement POST /api/scores/[scoreId]/comments endpoint for creating comments
  - Implement DELETE /api/scores/comments/[commentId] endpoint for deleting own comments
  - Implement GET /api/scores/[scoreId]/comments endpoint for retrieving comments
  - Add proper authentication, authorization, and input validation to all comment endpoints
  - _Requirements: 1.1, 1.3, 1.5, 1.6_

- [ ]\* 3.1 Write API tests for comment endpoints

  - Test comment creation with valid and invalid inputs
  - Test comment deletion authorization (only own comments)
  - Test comment retrieval with privacy settings
  - _Requirements: 1.1, 1.3, 1.5, 1.6_

- [x] 4. Create API endpoints for reaction operations

  - Implement POST /api/scores/[scoreId]/reactions endpoint for toggling reactions
  - Implement GET /api/scores/[scoreId]/reactions endpoint for retrieving reaction summaries
  - Add emoji type validation and user authorization to reaction endpoints
  - Create combined GET /api/scores/[scoreId]/interactions endpoint for both comments and reactions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]\* 4.1 Write API tests for reaction endpoints

  - Test reaction toggling with all supported emoji types
  - Test reaction retrieval and aggregation
  - Test combined interactions endpoint
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. Create base interaction UI components

  - Create CommentSection component with comment display and input form
  - Implement ReactionBar component with emoji buttons and counts
  - Create ReactionTooltip component to show users who reacted
  - Add proper loading states, error handling, and character limits to all components
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4, 2.5, 2.6_

- [ ]\* 5.1 Write component tests for interaction UI

  - Test comment submission and display functionality
  - Test reaction button interactions and state updates
  - Test tooltip display and user list functionality
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 6. Integrate interactions into existing score cards

  - Create main ScoreInteractions component that combines comments and reactions
  - Modify ScoreCardList component to include ScoreInteractions for each score entry
  - Add interaction data fetching to existing score loading logic
  - Ensure proper spacing and visual hierarchy with existing score card design
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Implement optimistic UI updates and error handling

  - Add optimistic updates for comment creation and reaction toggling
  - Implement error recovery that reverts optimistic changes on API failures
  - Add retry mechanisms for failed interaction requests
  - Create user-friendly error messages for various failure scenarios
  - _Requirements: 1.6, 2.3, 5.3_

- [x] 8. Add real-time updates with Server-Sent Events

  - Create SSE endpoint at /api/scores/[scoreId]/events for broadcasting interaction changes
  - Implement client-side SSE connection management in ScoreInteractions component
  - Add event broadcasting to API endpoints when comments or reactions are modified
  - Implement fallback polling mechanism when SSE connection fails
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]\* 8.1 Write integration tests for real-time features

  - Test SSE connection establishment and event reception
  - Test event broadcasting when interactions are created or modified
  - Test fallback polling mechanism
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Implement privacy controls and permission checking

  - Integrate interaction permissions with existing user privacy settings (isPrivate field)
  - Add friendship checking to determine interaction eligibility
  - Hide interaction UI elements when user cannot interact with a score
  - Add visual indicators to show when interactions are restricted
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Add interaction activity indicators and engagement features

  - Create visual indicators for score owners to see new comments and reactions
  - Implement interaction count badges on score cards
  - Add hover states and animations to enhance user experience
  - Create responsive design for interaction components on mobile devices
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]\* 10.1 Write end-to-end tests for complete interaction workflows
  - Test complete comment creation, display, and deletion workflow
  - Test emoji reaction workflow with multiple users
  - Test privacy scenarios between friends and non-friends
  - Test real-time updates across multiple browser sessions
  - _Requirements: 1.1, 1.6, 2.1, 2.6, 4.1, 4.2, 5.1, 5.2_
