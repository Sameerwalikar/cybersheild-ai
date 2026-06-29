# Requirements Document

## Introduction

This specification defines the complete product architecture for the CyberShield AI Citizen Portal. The document captures the full citizen user journey, dashboard composition, feature modules, API contracts, data models, component hierarchy, state management, navigation, and success metrics. This is an architecture-only sprint — the output is a structured document at `docs/product-architecture.md` with no code implementation.

## Glossary

- **Citizen_Portal**: The web application interface serving individual citizens for threat detection, scanning, and reporting cyber threats
- **AEGIS**: The AI assistant integrated into the platform that provides conversational threat guidance and security recommendations
- **Dashboard**: The main authenticated landing view showing threat status widgets, quick actions, and recent activity
- **Threat_Scanner**: The module allowing citizens to analyze messages, URLs, QR codes, UPI IDs, and voice recordings for threats
- **Risk_Score**: A numerical confidence value (0-100) representing the likelihood that scanned content is malicious
- **Architecture_Document**: The markdown file at `docs/product-architecture.md` containing all architectural definitions
- **Widget**: A self-contained UI card on the dashboard displaying a specific category of information
- **Quick_Action**: A shortcut button on the dashboard that launches a specific scanning or reporting workflow
- **API_Contract**: The request/response schema definition for a backend endpoint (design only, no implementation)
- **Data_Model**: A typed entity definition representing a domain object stored or transmitted by the system

## Requirements

### Requirement 1: Architecture Document Creation

**User Story:** As a developer, I want a single structured architecture document, so that the team has a reference for all citizen portal design decisions.

#### Acceptance Criteria

1. THE Architecture_Document SHALL be created at the path `docs/product-architecture.md` relative to the frontend project root
2. THE Architecture_Document SHALL contain all sections defined in this specification: User Journey, Dashboard Widgets, Feature Modules, API Contracts, Data Models, Component Hierarchy, State Management, Navigation, and Success Metrics
3. THE Architecture_Document SHALL use markdown formatting with hierarchical headings, tables, and code blocks for type definitions
4. THE Architecture_Document SHALL contain zero code implementation — only design definitions, schemas, and type annotations

### Requirement 2: Citizen User Journey Definition

**User Story:** As a product designer, I want the full citizen user journey mapped, so that all screens and transitions are documented.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define the complete user journey flow: Landing → Role Selection → Authentication → Dashboard → Scanner → Analysis → History → Reports → Profile → Settings
2. WHEN documenting each journey step, THE Architecture_Document SHALL specify the route path, entry conditions, and exit transitions
3. THE Architecture_Document SHALL map the journey steps to existing Next.js route groups: `(marketing)`, `(auth)`, and `(citizen)`

### Requirement 3: Dashboard Widget Specifications

**User Story:** As a frontend developer, I want each dashboard widget defined with its data requirements, so that I can implement them independently.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define exactly eight dashboard widgets: Threat Status, Quick Actions, Recent Reports, Recent Analysis, Threat Timeline, Security Tips, AEGIS Assistant, and Notifications
2. WHEN defining each widget, THE Architecture_Document SHALL specify the widget purpose, data source, refresh strategy, and visual layout description
3. THE Architecture_Document SHALL define the responsive grid placement for all widgets across desktop, tablet, and mobile breakpoints

### Requirement 4: Feature Module Specifications

**User Story:** As a developer, I want each scanning feature module fully specified, so that I understand inputs, outputs, API integration, and error handling.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define six feature modules: Scan Message, Scan Website, Scan QR, Scan UPI, Report Scam, and Voice Analysis
2. WHEN defining each feature module, THE Architecture_Document SHALL specify: purpose, user inputs, expected outputs, API endpoint, AI service dependency, database entities, error states, and loading states
3. THE Architecture_Document SHALL define the shared analysis result pattern used across all scan types

### Requirement 5: API Contract Definitions

**User Story:** As a backend developer, I want API contracts defined with request/response schemas, so that I can implement endpoints matching the frontend expectations.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define contracts for: POST /api/analyze/message, POST /api/analyze/url, POST /api/report, GET /api/history, and GET /api/profile
2. WHEN defining each API contract, THE Architecture_Document SHALL specify: HTTP method, path, request body schema, response body schema, error response schema, and authentication requirement
3. THE Architecture_Document SHALL use TypeScript interface notation for all request and response type definitions

### Requirement 6: Data Model Definitions

**User Story:** As a developer, I want all domain entities defined with their fields and relationships, so that I can implement the data layer consistently.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define these data models: Citizen, Threat, Report, ThreatAnalysis, Notification, RiskScore, ScanHistory, SavedWebsite, and Profile
2. WHEN defining each data model, THE Architecture_Document SHALL specify all fields with TypeScript types, optional markers, and brief descriptions
3. THE Architecture_Document SHALL document relationships between data models using foreign key references

### Requirement 7: Component Hierarchy Definition

**User Story:** As a frontend developer, I want the component tree documented, so that I understand the composition and prop-passing patterns.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define these components: DashboardLayout, WidgetCard, QuickAction, AnalysisPanel, HistoryTable, NotificationCard, and AIResponse
2. WHEN defining each component, THE Architecture_Document SHALL specify: purpose, props interface, child components, and state dependencies
3. THE Architecture_Document SHALL document how components compose within the existing DashboardLayout and route structure

### Requirement 8: State Management Architecture

**User Story:** As a developer, I want the Zustand store architecture documented, so that I understand what state lives where and how stores interact.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define these Zustand stores: Authentication, Dashboard, Scanner, History, Notifications, Theme, and Future AI
2. WHEN defining each store, THE Architecture_Document SHALL specify: state shape, actions, selectors, and persistence strategy
3. THE Architecture_Document SHALL document how the stores extend the existing `useAuthStore`, `useUIStore`, and `useNotificationStore`

### Requirement 9: Navigation Architecture

**User Story:** As a developer, I want the sidebar navigation fully specified, so that I can implement it matching the architecture.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define sidebar navigation items: Dashboard, Threat Scanner, History, Reports, AEGIS, Settings, and Profile
2. WHEN defining each navigation item, THE Architecture_Document SHALL specify: label, icon name, route path, and active state detection logic
3. THE Architecture_Document SHALL document the mobile navigation pattern (bottom tab bar) with the same item set

### Requirement 10: Success Metrics Definition

**User Story:** As a product manager, I want measurable success metrics defined, so that I can evaluate the portal effectiveness after launch.

#### Acceptance Criteria

1. THE Architecture_Document SHALL define these metrics: average analysis time, threat detection confidence, scans completed, and reports submitted
2. WHEN defining each metric, THE Architecture_Document SHALL specify: metric name, unit of measurement, target value, and data source
3. THE Architecture_Document SHALL define how metrics are collected and displayed within the citizen dashboard
