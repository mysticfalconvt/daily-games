# Implementation Plan

- [x] 1. Set up database schema for friends system

  - Create friendships table schema with proper relations
  - Create friend_requests table schema with status tracking
  - Add database relations to existing users schema
  - Generate and run database migration
  - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [ ] 2. Implement core friend service layer

  - [x] 2.1 Create friend service with request management functions
    - Write sendFriendRequest function with email lookup and validation
    - Implement acceptFriendRequest with bidirectional friendship creation
    - Code declineFriendRequest and cancelFriendRequest functions
    - Add removeFriend function with bidirectional removal
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.4, 2.5, 4.4, 5.3_
  - [x] 2.2 Create friend data retrieval functions
    - Implement getFriends function to get user's friend list
    - Write getIncomingRequests and getOutgoingRequests functions
    - Add getPendingRequestCount for notification badge
    - _Requirements: 2.1, 4.1, 5.1_
  - [ ]\* 2.3 Write unit tests for friend service
    - Test friend request validation logic
    - Test bidirectional friendship creation and removal
    - Test error handling for edge cases
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ] 3. Create API endpoints for friend operations

  - [x] 3.1 Implement friend request API routes
    - Create POST /api/friends/request endpoint with email validation
    - Add POST /api/friends/accept and /api/friends/decline endpoints
    - Implement DELETE /api/friends/cancel and /api/friends/remove endpoints
    - Add proper authentication and authorization checks
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.4, 2.5, 4.4, 5.3_
  - [x] 3.2 Create friend data retrieval API routes
    - Implement GET /api/friends endpoint for friends list
    - Add GET /api/friends/requests/incoming and /api/friends/requests/outgoing
    - Create GET /api/friends/requests/count for notification badge
    - _Requirements: 2.1, 4.1, 5.1_
  - [ ]\* 3.3 Write API endpoint tests
    - Test authentication and authorization
    - Test request validation and error responses
    - Test successful operation responses
    - _Requirements: 1.2, 2.4, 4.4_

- [ ] 4. Implement score filtering system

  - [x] 4.1 Create score filtering service
    - Write getUserFriendIds function to get user's friend IDs
    - Implement getFilteredScores function with friend filtering logic
    - Add shouldShowAllUsers function for fallback behavior
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 Update existing score components with filtering
    - Modify ScoreCardList component to use friend filtering
    - Update by-game score displays with friend filtering
    - Ensure fallback to all users when no friends exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]\* 4.3 Write score filtering tests
    - Test filtering logic with various friend scenarios
    - Test fallback behavior for users without friends
    - Test performance with large datasets
    - _Requirements: 3.1, 3.2_

- [ ] 5. Create profile page friend management UI

  - [x] 5.1 Build AddFriendForm component
    - Create email input form with validation
    - Add submit handler with API integration
    - Implement error display for validation failures
    - Show success feedback for sent requests
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 5.2 Create FriendRequestsList component
    - Display incoming friend requests with sender information
    - Add Accept and Decline buttons with API integration
    - Show loading states during request processing
    - Update list after actions are completed
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - [x] 5.3 Build SentRequestsList component
    - Display outgoing pending requests with recipient information
    - Add Cancel button with confirmation dialog
    - Remove items from list after cancellation
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 5.4 Create FriendsList component
    - Display current friends with user information
    - Add Remove Friend button with confirmation dialog
    - Update list after friend removal
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]\* 5.5 Write component tests
    - Test form validation and submission
    - Test button interactions and state updates
    - Test error handling and loading states
    - _Requirements: 1.2, 2.4, 4.4_

- [ ] 6. Implement notification system

  - [x] 6.1 Create notification badge component
    - Build NotificationBadge component with count display
    - Add red styling for pending request count
    - Hide badge when count is zero
    - _Requirements: 2.1, 2.6_
  - [x] 6.2 Update navigation with notification badge
    - Modify app navbar to include notification badge on profile link
    - Integrate with friend request count API
    - Ensure badge updates when requests are processed
    - _Requirements: 2.1, 2.6_
  - [ ]\* 6.3 Write notification tests
    - Test badge visibility and count display
    - Test badge updates after request actions
    - Test navigation integration
    - _Requirements: 2.1, 2.6_

- [ ] 7. Update profile page layout

  - [x] 7.1 Integrate friend management components into profile page
    - Add friend management sections to profile page
    - Organize components with proper spacing and layout
    - Ensure responsive design for mobile devices
    - _Requirements: 1.1, 2.1, 4.1, 5.1_
  - [x] 7.2 Add loading and error states
    - Implement loading indicators for async operations
    - Add error boundaries for component failures
    - Show appropriate messages for empty states
    - _Requirements: 1.2, 2.4, 4.4_
  - [ ]\* 7.3 Write integration tests
    - Test complete friend request workflow
    - Test profile page functionality end-to-end
    - Test responsive design and accessibility
    - _Requirements: 1.1, 2.1, 4.1, 5.1_

- [ ] 8. Final integration and testing

  - [x] 8.1 Test complete friend system workflow
    - Verify friend request sending and receiving
    - Test friendship creation and score filtering
    - Validate notification system functionality
    - Ensure proper error handling throughout
    - _Requirements: All requirements_
  - [x] 8.2 Performance optimization and cleanup
    - Add database indexes for friend-related queries
    - Optimize score filtering queries for performance
    - Clean up any unused code or imports
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
