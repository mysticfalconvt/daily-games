# Requirements Document

## Introduction

This feature introduces a friends system to the daily games application, allowing users to connect with specific friends rather than seeing all users' scores. Users will be able to send friend requests by email address, receive notifications for pending requests, and manage their friend connections through the profile page.

## Requirements

### Requirement 1

**User Story:** As a logged-in user, I want to add friends by their email address, so that I can connect with specific people I know rather than seeing all users.

#### Acceptance Criteria

1. WHEN a user navigates to the profile page THEN the system SHALL display an "Add Friend" section with an email input field and submit button
2. WHEN a user enters a valid email address and clicks submit THEN the system SHALL send a friend request to that email address if it corresponds to an existing user
3. WHEN a user enters an email that doesn't exist in the system THEN the system SHALL display an error message "User not found"
4. WHEN a user tries to add themselves as a friend THEN the system SHALL display an error message "Cannot add yourself as a friend"
5. WHEN a user tries to add someone who is already their friend THEN the system SHALL display an error message "Already friends with this user"
6. WHEN a user tries to add someone they've already sent a request to THEN the system SHALL display an error message "Friend request already sent"

### Requirement 2

**User Story:** As a user who receives a friend request, I want to see a notification and be able to accept or decline the request, so that I can control who I'm connected with.

#### Acceptance Criteria

1. WHEN a user has pending friend requests THEN the system SHALL display a red notification badge with the count on the profile navigation button
2. WHEN a user navigates to the profile page with pending requests THEN the system SHALL display a "Friend Requests" section showing all pending incoming requests
3. WHEN a user views a friend request THEN the system SHALL display the requester's name/email and "Accept" and "Decline" buttons
4. WHEN a user clicks "Accept" on a friend request THEN the system SHALL create a bidirectional friendship and remove the request
5. WHEN a user clicks "Decline" on a friend request THEN the system SHALL remove the request without creating a friendship
6. WHEN a user accepts or declines a request THEN the notification count SHALL update accordingly

### Requirement 3

**User Story:** As a user with friends, I want to see only my friends' scores instead of all users, so that the experience is more personal and relevant.

#### Acceptance Criteria

1. WHEN a user has friends THEN the system SHALL filter score displays to show only friends' scores plus their own
2. WHEN a user has no friends THEN the system SHALL continue to show all users' scores as before
3. WHEN viewing game scores by game type THEN the system SHALL apply the same friend filtering
4. WHEN viewing the dashboard THEN the system SHALL show only friends' recent scores and activities

### Requirement 4

**User Story:** As a user, I want to manage my existing friendships, so that I can remove connections I no longer want.

#### Acceptance Criteria

1. WHEN a user navigates to the profile page THEN the system SHALL display a "My Friends" section listing all current friends
2. WHEN viewing the friends list THEN the system SHALL display each friend's name/email and a "Remove Friend" button
3. WHEN a user clicks "Remove Friend" THEN the system SHALL prompt for confirmation
4. WHEN a user confirms friend removal THEN the system SHALL remove the bidirectional friendship
5. WHEN a friendship is removed THEN both users SHALL no longer see each other's scores in filtered views

### Requirement 5

**User Story:** As a user, I want to see the status of friend requests I've sent, so that I know whether they're pending, accepted, or declined.

#### Acceptance Criteria

1. WHEN a user navigates to the profile page THEN the system SHALL display a "Sent Requests" section showing outgoing pending requests
2. WHEN viewing sent requests THEN the system SHALL display the recipient's email and a "Cancel Request" option
3. WHEN a user cancels a sent request THEN the system SHALL remove the pending request
4. WHEN a sent request is accepted or declined THEN the system SHALL remove it from the sent requests list