# Requirements Document

## Introduction

A centralized Real-Time Activity & Notification System for CyberShield AI that automatically generates notifications for user actions (scans, reports, AEGIS conversations, profile updates), provides a CRUD API for notification management, delivers an activity timeline feed, and enables real-time dashboard synchronization after mutations — all integrating with the existing Notification model and JWT authentication without redesigning existing pages.

## Glossary

- **Notification_Service**: The backend service responsible for creating, querying, updating, and deleting notification records using the existing Prisma Notification model.
- **Activity_Service**: The backend service responsible for aggregating user actions into a chronological activity timeline feed.
- **Dashboard_Sync_Engine**: The frontend mechanism that automatically refreshes affected dashboard widgets after backend mutations complete, without full page reloads.
- **Notification_Panel**: The frontend UI component (slide-out or dropdown) that displays the user's notifications with unread badge, read-all action, and infinite scroll.
- **Toast_Manager**: The frontend component responsible for displaying transient toast notifications when new events arrive.
- **Scanner_Service**: The existing backend module that performs threat scans (message, URL, QR, UPI, voice) and produces analysis results.
- **AEGIS_Service**: The existing backend module managing AI assistant conversations.
- **Notification**: A database record in the existing Prisma Notification model containing id, userId, type, title, message, severity, isRead, actionUrl, relatedId, createdAt, and readAt fields.
- **Activity_Entry**: A human-readable record representing a single user action in the chronological activity timeline.
- **Unread_Badge**: A visual indicator on the UI showing the count of unread notifications for the authenticated user.
- **Optimistic_Update**: A frontend technique where the UI reflects a change immediately before server confirmation, rolling back on failure.

## Requirements

### Requirement 1: Notification Generation on Scan Completion

**User Story:** As a citizen user, I want to receive a notification automatically after each scan completes, so that I am informed of scan results without manually checking.

#### Acceptance Criteria

1. WHEN a threat scan completes with a risk level of HIGH or CRITICAL, THE Notification_Service SHALL create a Notification record with type THREAT_ALERT, severity CRITICAL, a title containing the scan type, and a message summarizing the risk level and score.
2. WHEN a threat scan completes with a risk level of SAFE, LOW, or MEDIUM, THE Notification_Service SHALL create a Notification record with type SCAN_COMPLETE, severity INFO, a title containing the scan type, and a message summarizing the result.
3. THE Notification_Service SHALL set the relatedId field to the scan ID and the actionUrl field to the scan result detail path for every scan-triggered notification.

### Requirement 2: Notification Generation on User Actions

**User Story:** As a citizen user, I want to receive notifications when important account actions occur (evidence uploads, report submissions, AEGIS conversations, profile changes), so that I have a record of my activity.

#### Acceptance Criteria

1. WHEN a user submits a threat report, THE Notification_Service SHALL create a Notification record with type REPORT_UPDATE, severity INFO, and a message containing the report number.
2. WHEN a user creates a new AEGIS conversation, THE Notification_Service SHALL create a Notification record with type SYSTEM, severity INFO, and a message indicating the conversation title.
3. WHEN a user updates their profile, THE Notification_Service SHALL create a Notification record with type SYSTEM, severity INFO, and a message indicating which profile fields changed.
4. WHEN a user changes their password, THE Notification_Service SHALL create a Notification record with type SECURITY_TIP, severity WARNING, and a message confirming the password change with a security reminder.

### Requirement 3: Notification List API

**User Story:** As a citizen user, I want to retrieve my notifications in a paginated list, so that I can review them without loading all records at once.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a GET /api/v1/notifications endpoint that requires a valid JWT and returns notifications belonging to the authenticated user.
2. WHEN the GET /api/v1/notifications endpoint is called, THE Notification_Service SHALL return notifications ordered by createdAt descending, paginated with a default page size of 20.
3. WHEN the request includes page and limit query parameters, THE Notification_Service SHALL return the corresponding page of results along with total count and page metadata.
4. IF the JWT is missing or expired, THEN THE Notification_Service SHALL respond with HTTP 401 and an error message indicating authentication failure.

### Requirement 4: Mark Notification as Read API

**User Story:** As a citizen user, I want to mark individual notifications as read, so that I can track which notifications I have already reviewed.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a PATCH /api/v1/notifications/:id/read endpoint that requires a valid JWT.
2. WHEN the PATCH /api/v1/notifications/:id/read endpoint is called, THE Notification_Service SHALL set isRead to true and readAt to the current timestamp for the specified notification.
3. IF the notification does not exist or does not belong to the authenticated user, THEN THE Notification_Service SHALL respond with HTTP 404 and an error message.
4. IF the notification is already marked as read, THEN THE Notification_Service SHALL respond with HTTP 200 and the unchanged notification data.

### Requirement 5: Mark All Notifications as Read API

**User Story:** As a citizen user, I want to mark all my notifications as read in a single action, so that I can quickly clear my unread count.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a PATCH /api/v1/notifications/read-all endpoint that requires a valid JWT.
2. WHEN the PATCH /api/v1/notifications/read-all endpoint is called, THE Notification_Service SHALL set isRead to true and readAt to the current timestamp for all unread notifications belonging to the authenticated user.
3. THE Notification_Service SHALL respond with the count of notifications that were marked as read.

### Requirement 6: Delete Notification API

**User Story:** As a citizen user, I want to delete individual notifications, so that I can remove irrelevant items from my notification list.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a DELETE /api/v1/notifications/:id endpoint that requires a valid JWT.
2. WHEN the DELETE /api/v1/notifications/:id endpoint is called, THE Notification_Service SHALL permanently remove the specified notification from the database.
3. IF the notification does not exist or does not belong to the authenticated user, THEN THE Notification_Service SHALL respond with HTTP 404 and an error message.

### Requirement 7: Activity Timeline API

**User Story:** As a citizen user, I want to view a chronological feed of all my actions in CyberShield AI, so that I can review my usage history.

#### Acceptance Criteria

1. THE Activity_Service SHALL expose a GET /api/v1/activity endpoint that requires a valid JWT and returns activity entries for the authenticated user.
2. WHEN the GET /api/v1/activity endpoint is called, THE Activity_Service SHALL aggregate actions from threat scans, threat reports, AEGIS conversations, and profile updates into a single chronological feed ordered by timestamp descending.
3. THE Activity_Service SHALL return each activity entry with a human-readable label (e.g., "High-risk phishing URL detected", "Threat report #RPT-001 submitted", "AEGIS conversation started").
4. WHEN the request includes page and limit query parameters, THE Activity_Service SHALL return paginated results with total count metadata.
5. WHEN the request includes a type filter query parameter, THE Activity_Service SHALL return only activity entries matching the specified type (scan, report, conversation, profile).

### Requirement 8: Real-Time Dashboard Synchronization

**User Story:** As a citizen user, I want the dashboard to automatically refresh relevant widgets after I perform a scan or other action, so that I always see up-to-date information without manually reloading.

#### Acceptance Criteria

1. WHEN a scan mutation completes on the backend, THE Dashboard_Sync_Engine SHALL trigger a refresh of the Threat Status, Recent Activity, Threat Timeline, Security Score, Recent Analysis, and Notifications widgets.
2. WHEN a report submission completes, THE Dashboard_Sync_Engine SHALL trigger a refresh of the Recent Activity and Notifications widgets.
3. WHEN an AEGIS conversation is created, THE Dashboard_Sync_Engine SHALL trigger a refresh of the Recent Activity and Notifications widgets.
4. THE Dashboard_Sync_Engine SHALL refresh only the affected widgets without performing a full page reload.
5. THE Dashboard_Sync_Engine SHALL use query invalidation to re-fetch stale data from the server after each mutation.

### Requirement 9: Notification Panel Frontend Component

**User Story:** As a citizen user, I want a notification panel accessible from the navigation bar, so that I can quickly view and manage my notifications.

#### Acceptance Criteria

1. THE Notification_Panel SHALL display as a slide-out panel or dropdown triggered by a bell icon in the navigation bar.
2. THE Notification_Panel SHALL display the Unread_Badge showing the count of unread notifications; WHILE the count is zero, THE Notification_Panel SHALL hide the badge.
3. THE Notification_Panel SHALL display notifications grouped by read status with unread notifications appearing first.
4. THE Notification_Panel SHALL provide a "Mark All as Read" button that calls the mark-all-read API endpoint.
5. THE Notification_Panel SHALL support infinite scroll to load older notifications on demand.
6. WHILE notifications are loading, THE Notification_Panel SHALL display a loading skeleton placeholder.
7. WHILE the notification list is empty, THE Notification_Panel SHALL display an empty state message indicating no notifications exist.

### Requirement 10: Toast Notifications

**User Story:** As a citizen user, I want to see a brief toast notification when a new event occurs (such as scan completion), so that I am immediately aware of important updates.

#### Acceptance Criteria

1. WHEN a mutation (scan, report, AEGIS conversation, profile update) completes successfully, THE Toast_Manager SHALL display a transient toast notification with the event summary.
2. THE Toast_Manager SHALL auto-dismiss toast notifications after 5 seconds.
3. THE Toast_Manager SHALL allow the user to manually dismiss a toast before auto-dismissal.
4. WHEN multiple events complete in rapid succession, THE Toast_Manager SHALL stack toasts vertically without overlapping content.

### Requirement 11: Optimistic Updates and Caching

**User Story:** As a citizen user, I want the UI to respond instantly when I mark notifications as read or delete them, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN the user marks a notification as read, THE Dashboard_Sync_Engine SHALL optimistically update the UI to reflect the read state before server confirmation.
2. WHEN the user deletes a notification, THE Dashboard_Sync_Engine SHALL optimistically remove the notification from the list before server confirmation.
3. IF the server responds with an error after an optimistic update, THEN THE Dashboard_Sync_Engine SHALL roll back the UI to the previous state and display an error toast.
4. THE Notification_Service SHALL cache notification list query results and invalidate the cache when mutations occur.

### Requirement 12: Error Handling and Recovery

**User Story:** As a citizen user, I want the notification system to handle failures gracefully, so that errors do not crash the application or lose my data.

#### Acceptance Criteria

1. IF a network request to the notification API fails, THEN THE Notification_Panel SHALL display a retry option and a user-friendly error message without crashing.
2. IF the JWT has expired during a notification request, THEN THE Dashboard_Sync_Engine SHALL trigger the authentication refresh flow before retrying the request.
3. IF the database is unavailable during notification creation, THEN THE Notification_Service SHALL log the error and allow the parent operation (scan, report) to complete without failure.
4. IF a notification referenced by ID does not exist in the database, THEN THE Notification_Service SHALL respond with HTTP 404 and a descriptive error message.

### Requirement 13: Schema Compatibility

**User Story:** As a developer, I want the notification system to use the existing Notification model without removing columns, so that existing data and integrations remain intact.

#### Acceptance Criteria

1. THE Notification_Service SHALL use the existing Notification model fields (id, userId, type, title, message, severity, isRead, actionUrl, relatedId, createdAt, readAt) without modification.
2. IF additional metadata is required for activity context, THEN THE Notification_Service SHALL store it in a new optional metadata JSON field added to the Notification model via a Prisma migration.
3. THE Notification_Service SHALL preserve all existing Notification model columns and indexes during any schema extension.
