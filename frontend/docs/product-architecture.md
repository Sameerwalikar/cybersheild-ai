# CyberShield AI — Citizen Portal Product Architecture

> **Sprint Type:** Architecture & Documentation Only  
> **Status:** Design Complete  
> **Last Updated:** 2025  
> **Stack:** Next.js 16 · React 19 · Zustand 5 · Tailwind CSS 4 · Framer Motion · Zod

---

## Table of Contents

1. [Citizen User Journey](#1-citizen-user-journey)
2. [Dashboard Widgets](#2-dashboard-widgets)
3. [Feature Modules (Quick Actions)](#3-feature-modules-quick-actions)
4. [API Contracts](#4-api-contracts)
5. [Data Models](#5-data-models)
6. [Component Hierarchy](#6-component-hierarchy)
7. [State Management](#7-state-management)
8. [Navigation Architecture](#8-navigation-architecture)
9. [Success Metrics](#9-success-metrics)

---

## 1. Citizen User Journey

### Flow Overview

```
Landing → Role Selection → Authentication → Dashboard → [Feature Modules] → Analysis → History/Reports
```

### Journey Steps

| Step | Route | Route Group | Entry Condition | Exit Transitions |
|------|-------|-------------|-----------------|------------------|
| Landing | `/` | `(marketing)` | None (public) | Role Selection, Login |
| Role Selection | `/select-role` | `(auth)` | User clicked "Get Started" | Login, Register |
| Login | `/login` | `(auth)` | Role selected or direct visit | Dashboard, Register, Forgot Password |
| Register | `/register` | `(auth)` | Role selected | Dashboard, Login |
| Forgot Password | `/forgot-password` | `(auth)` | Clicked "Forgot?" on login | Login |
| Dashboard | `/citizen-dashboard` | `(citizen)` | Authenticated as citizen | Scanner, History, Reports, Settings, Profile |
| Threat Scanner | `/scan` | `(citizen)` | Authenticated | Analysis Result, Dashboard |
| Analysis Result | `/scan?result={id}` | `(citizen)` | Scan completed | History, New Scan, Report |
| Threat History | `/threats` | `(citizen)` | Authenticated | Analysis Detail, Dashboard |
| Reports | `/reports` | `(citizen)` | Authenticated | New Report, Dashboard |
| Settings | `/citizen-settings` | `(citizen)` | Authenticated | Dashboard |
| Profile | `/citizen-settings?tab=profile` | `(citizen)` | Authenticated | Dashboard |

### Journey Rules

- Unauthenticated users accessing `(citizen)` routes redirect to `/login`
- Authenticated users accessing `(auth)` routes redirect to `/citizen-dashboard`
- Role mismatch redirects to the correct role dashboard

---

## 2. Dashboard Widgets

### Grid Layout

```
Desktop (lg+):    3-column grid, 4 rows
Tablet (md):      2-column grid, stacked
Mobile (sm):      1-column stack, priority order
```

### Widget Definitions

#### 2.1 Threat Status Widget

| Property | Value |
|----------|-------|
| **Purpose** | Display current threat level and protection status |
| **Data Source** | `GET /api/profile` → `threatLevel`, real-time WebSocket updates |
| **Refresh** | WebSocket push + 60s polling fallback |
| **Grid Position** | Desktop: col 1, row 1 (span 2 cols). Mobile: priority 1 |
| **Visual** | Large threat level indicator (Safe/Caution/Danger), animated shield icon, last scan timestamp |

#### 2.2 Quick Actions Widget

| Property | Value |
|----------|-------|
| **Purpose** | Provide one-tap access to all scanning and reporting features |
| **Data Source** | Static configuration (no API) |
| **Refresh** | None (static) |
| **Grid Position** | Desktop: col 3, row 1. Mobile: priority 2 |
| **Visual** | 2×3 grid of icon buttons: Scan Message, Scan Website, Scan QR, Scan UPI, Report Scam, Voice Analysis |

#### 2.3 Recent Reports Widget

| Property | Value |
|----------|-------|
| **Purpose** | Show last 5 submitted scam reports with status |
| **Data Source** | `GET /api/history?type=reports&limit=5` |
| **Refresh** | On dashboard mount + pull-to-refresh |
| **Grid Position** | Desktop: col 1, row 2. Mobile: priority 4 |
| **Visual** | Compact list with status badges (pending/investigating/resolved), timestamps |

#### 2.4 Recent Analysis Widget

| Property | Value |
|----------|-------|
| **Purpose** | Show last 5 scan results with risk scores |
| **Data Source** | `GET /api/history?type=scans&limit=5` |
| **Refresh** | On dashboard mount + after new scan |
| **Grid Position** | Desktop: col 2, row 2. Mobile: priority 3 |
| **Visual** | List with risk score indicators (color-coded), content preview, scan type icon |

#### 2.5 Threat Timeline Widget

| Property | Value |
|----------|-------|
| **Purpose** | Visualize threat activity over time (7-day chart) |
| **Data Source** | `GET /api/history?range=7d&aggregate=daily` |
| **Refresh** | On dashboard mount, daily granularity |
| **Grid Position** | Desktop: col 1-2, row 3 (span 2 cols). Mobile: priority 6 |
| **Visual** | Line/area chart showing scans per day, threats detected, risk score average |

#### 2.6 Security Tips Widget

| Property | Value |
|----------|-------|
| **Purpose** | Display rotating cybersecurity awareness tips |
| **Data Source** | `GET /api/tips?limit=3` (cached 24h) |
| **Refresh** | Once per session, cached |
| **Grid Position** | Desktop: col 3, row 2. Mobile: priority 7 |
| **Visual** | Card carousel with tip title, brief description, "Learn More" link |

#### 2.7 AEGIS Assistant Widget

| Property | Value |
|----------|-------|
| **Purpose** | Mini AI chat interface for quick threat questions |
| **Data Source** | `POST /api/aegis/chat` (streaming) |
| **Refresh** | User-initiated (conversational) |
| **Grid Position** | Desktop: col 3, row 3-4. Mobile: priority 5 |
| **Visual** | Compact chat bubble with input field, last 3 messages visible, expand button |

#### 2.8 Notifications Widget

| Property | Value |
|----------|-------|
| **Purpose** | Show unread alerts and system notifications |
| **Data Source** | `GET /api/notifications?unread=true` + WebSocket |
| **Refresh** | WebSocket push + 30s polling |
| **Grid Position** | Desktop: col 1-3, row 4. Mobile: priority 8 |
| **Visual** | Horizontal scrollable notification cards with dismiss action, badge count |

---

## 3. Feature Modules (Quick Actions)

### 3.1 Scan Message

| Property | Specification |
|----------|--------------|
| **Purpose** | Analyze SMS/WhatsApp/email messages for phishing, scam, or fraud indicators |
| **User Inputs** | Message text (string, 1-5000 chars), optional sender ID, message source (sms/whatsapp/email) |
| **Expected Outputs** | Risk score (0-100), threat categories, flagged keywords, recommended action, confidence level |
| **API Endpoint** | `POST /api/analyze/message` |
| **AI Service** | NLP Threat Classifier → Phishing Pattern Detector → Risk Score Engine |
| **DB Entities** | `ThreatAnalysis`, `ScanHistory`, `RiskScore` |
| **Error States** | Empty input, text too long, rate limit exceeded, AI service timeout, network failure |
| **Loading States** | Skeleton card → "Analyzing message..." with progress indicator → Result reveal animation |

### 3.2 Scan Website

| Property | Specification |
|----------|--------------|
| **Purpose** | Check URLs for malicious content, phishing pages, or unsafe redirects |
| **User Inputs** | URL (valid URL string), optional: screenshot toggle |
| **Expected Outputs** | Risk score, domain reputation, SSL status, redirect chain, content analysis, screenshot preview |
| **API Endpoint** | `POST /api/analyze/url` |
| **AI Service** | URL Reputation API → Content Classifier → Redirect Analyzer → Screenshot Service |
| **DB Entities** | `ThreatAnalysis`, `ScanHistory`, `SavedWebsite`, `RiskScore` |
| **Error States** | Invalid URL format, unreachable URL, DNS resolution failure, timeout, rate limit |
| **Loading States** | URL validation → "Fetching page..." → "Analyzing content..." → Result |

### 3.3 Scan QR Code

| Property | Specification |
|----------|--------------|
| **Purpose** | Decode and analyze QR codes for malicious URLs or payment fraud |
| **User Inputs** | QR image (camera capture or file upload, PNG/JPG, max 5MB) |
| **Expected Outputs** | Decoded content, content type (URL/UPI/text), risk score, threat indicators |
| **API Endpoint** | `POST /api/analyze/message` (with `type: "qr"` after client-side decode) |
| **AI Service** | QR Decoder (client-side) → URL/UPI Analyzer → Risk Score Engine |
| **DB Entities** | `ThreatAnalysis`, `ScanHistory`, `RiskScore` |
| **Error States** | Camera permission denied, invalid QR, unreadable image, decode failure, analysis timeout |
| **Loading States** | Camera active → "Scanning..." → "Decoding QR..." → "Analyzing content..." → Result |

### 3.4 Scan UPI

| Property | Specification |
|----------|--------------|
| **Purpose** | Verify UPI IDs against known fraud databases and pattern analysis |
| **User Inputs** | UPI ID (string matching `[a-zA-Z0-9._-]+@[a-zA-Z]+`), optional transaction context |
| **Expected Outputs** | Risk score, fraud reports count, account age indicator, pattern match flags, recommendation |
| **API Endpoint** | `POST /api/analyze/message` (with `type: "upi"`) |
| **AI Service** | UPI Fraud Database Lookup → Pattern Analyzer → Community Reports Aggregator |
| **DB Entities** | `ThreatAnalysis`, `ScanHistory`, `RiskScore` |
| **Error States** | Invalid UPI format, service unavailable, no data found, rate limit |
| **Loading States** | Input validation → "Checking databases..." → "Analyzing patterns..." → Result |

### 3.5 Report Scam

| Property | Specification |
|----------|--------------|
| **Purpose** | Submit a scam/fraud report to authorities and community database |
| **User Inputs** | Scam type (dropdown), description (text, 10-2000 chars), evidence (files, max 3, max 10MB each), contact method of scammer, financial loss amount (optional) |
| **Expected Outputs** | Report ID, submission confirmation, estimated review time, related reports count |
| **API Endpoint** | `POST /api/report` |
| **AI Service** | Report Classifier → Duplicate Detection → Priority Scoring |
| **DB Entities** | `Report`, `Threat`, `Notification` |
| **Error States** | Missing required fields, file upload failure, file too large, submission failure, duplicate report |
| **Loading States** | Form validation → "Uploading evidence..." → "Submitting report..." → Confirmation |

### 3.6 Voice Analysis

| Property | Specification |
|----------|--------------|
| **Purpose** | Analyze recorded phone calls for social engineering and vishing patterns |
| **User Inputs** | Audio recording (file upload or live recording, WAV/MP3/M4A, max 60s, max 25MB) |
| **Expected Outputs** | Transcript, risk score, detected manipulation tactics, keyword flags, urgency indicators |
| **API Endpoint** | `POST /api/analyze/message` (with `type: "voice"`, multipart/form-data) |
| **AI Service** | Speech-to-Text → NLP Threat Classifier → Social Engineering Pattern Detector |
| **DB Entities** | `ThreatAnalysis`, `ScanHistory`, `RiskScore` |
| **Error States** | Microphone permission denied, unsupported format, file too large, transcription failure, analysis timeout |
| **Loading States** | Recording/Upload → "Transcribing audio..." → "Analyzing patterns..." → Result |

### Shared Analysis Result Pattern

All scan types produce a unified result structure displayed in the `AnalysisPanel` component:

```typescript
interface AnalysisResult {
  id: string;
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  riskScore: number;           // 0-100
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  threats: ThreatIndicator[];
  recommendation: string;
  confidence: number;          // 0-1
  timestamp: string;           // ISO 8601
  processingTime: number;      // milliseconds
}
```

---

## 4. API Contracts

### 4.1 POST /api/analyze/message

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
interface AnalyzeMessageRequest {
  type: "sms" | "whatsapp" | "email" | "qr" | "upi" | "voice";
  content: string;              // Text content or decoded QR data
  metadata?: {
    sender?: string;            // Sender ID or phone number
    source?: string;            // App or platform of origin
    timestamp?: string;         // When message was received
  };
}
```

**Response (200 OK):**
```typescript
interface AnalyzeMessageResponse {
  id: string;
  riskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  threats: {
    category: string;           // "phishing" | "scam" | "malware" | "social_engineering"
    confidence: number;         // 0-1
    description: string;
    indicators: string[];       // Flagged keywords/patterns
  }[];
  recommendation: string;
  processingTime: number;
  timestamp: string;
}
```

**Error Response (4xx/5xx):**
```typescript
interface ApiErrorResponse {
  error: string;
  code: "VALIDATION_ERROR" | "RATE_LIMITED" | "SERVICE_TIMEOUT" | "UNAUTHORIZED" | "INTERNAL_ERROR";
  details?: Record<string, string>;
}
```

### 4.2 POST /api/analyze/url

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
interface AnalyzeUrlRequest {
  url: string;                  // Full URL including protocol
  options?: {
    screenshot?: boolean;       // Capture page screenshot
    followRedirects?: boolean;  // Analyze redirect chain (default: true)
    deepScan?: boolean;         // Full content analysis (slower)
  };
}
```

**Response (200 OK):**
```typescript
interface AnalyzeUrlResponse {
  id: string;
  riskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  domain: {
    name: string;
    registeredDate: string;
    reputation: number;         // 0-100
    ssl: { valid: boolean; issuer: string; expiry: string };
  };
  redirectChain: { url: string; statusCode: number }[];
  threats: {
    category: string;
    confidence: number;
    description: string;
  }[];
  screenshot?: string;          // Base64 encoded thumbnail
  recommendation: string;
  processingTime: number;
  timestamp: string;
}
```

### 4.3 POST /api/report

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
interface CreateReportRequest {
  type: "phishing" | "financial_fraud" | "identity_theft" | "vishing" | "upi_fraud" | "other";
  description: string;          // 10-2000 characters
  scammerContact?: {
    type: "phone" | "email" | "upi" | "website" | "social_media";
    value: string;
  };
  financialLoss?: {
    amount: number;
    currency: "INR";
  };
  evidence?: string[];          // Pre-uploaded file IDs (max 3)
  occurredAt?: string;          // ISO 8601 date of incident
}
```

**Response (201 Created):**
```typescript
interface CreateReportResponse {
  id: string;
  status: "submitted";
  reportNumber: string;         // Human-readable reference (e.g., "RPT-2025-001234")
  estimatedReviewTime: string;  // e.g., "24-48 hours"
  relatedReports: number;       // Count of similar reports in system
  createdAt: string;
}
```

### 4.4 GET /api/history

**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
interface HistoryQueryParams {
  type?: "scans" | "reports" | "all";  // Default: "all"
  limit?: number;                       // Default: 20, max: 100
  offset?: number;                      // Default: 0
  range?: "7d" | "30d" | "90d" | "all"; // Default: "30d"
  aggregate?: "daily" | "weekly";       // For timeline widget
  sortBy?: "date" | "risk";            // Default: "date"
  order?: "asc" | "desc";             // Default: "desc"
}
```

**Response (200 OK):**
```typescript
interface HistoryResponse {
  items: (ScanHistoryItem | ReportHistoryItem)[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  aggregation?: {
    period: string;
    scansCount: number;
    threatsDetected: number;
    avgRiskScore: number;
  }[];
}

interface ScanHistoryItem {
  id: string;
  kind: "scan";
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  contentPreview: string;       // Truncated to 100 chars
  riskScore: number;
  riskLevel: string;
  timestamp: string;
}

interface ReportHistoryItem {
  id: string;
  kind: "report";
  reportNumber: string;
  type: string;
  status: "submitted" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
}
```

### 4.5 GET /api/profile

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```typescript
interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "citizen";
  stats: {
    totalScans: number;
    threatsBlocked: number;
    reportsSubmitted: number;
    memberSince: string;
  };
  threatLevel: "safe" | "elevated" | "high";
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
    theme: "dark" | "light" | "system";
  };
  lastActive: string;
}
```

---

## 5. Data Models

### 5.1 Citizen

```typescript
interface Citizen {
  id: string;                    // UUID
  name: string;
  email: string;
  phone?: string;
  avatar?: string;               // URL to avatar image
  role: "citizen";
  passwordHash: string;          // Server-side only
  isVerified: boolean;
  memberSince: string;           // ISO 8601
  lastActive: string;            // ISO 8601
  preferences: CitizenPreferences;
  createdAt: string;
  updatedAt: string;
}

interface CitizenPreferences {
  notifications: boolean;
  emailAlerts: boolean;
  language: string;              // ISO 639-1 code
  theme: "dark" | "light" | "system";
}
```

### 5.2 Threat

```typescript
interface Threat {
  id: string;                    // UUID
  type: "phishing" | "malware" | "scam" | "social_engineering" | "upi_fraud" | "vishing";
  severity: "critical" | "high" | "medium" | "low";
  source: string;                // Origin of threat detection
  description: string;
  indicators: string[];          // IoCs (indicators of compromise)
  status: "detected" | "analyzing" | "blocked" | "resolved";
  detectedAt: string;            // ISO 8601
  resolvedAt?: string;
  relatedAnalysisId?: string;    // FK → ThreatAnalysis.id
  reportedBy?: string;           // FK → Citizen.id (if user-reported)
}
```

### 5.3 Report

```typescript
interface Report {
  id: string;                    // UUID
  reportNumber: string;          // Human-readable (e.g., "RPT-2025-001234")
  citizenId: string;             // FK → Citizen.id
  type: "phishing" | "financial_fraud" | "identity_theft" | "vishing" | "upi_fraud" | "other";
  description: string;
  scammerContact?: {
    type: "phone" | "email" | "upi" | "website" | "social_media";
    value: string;
  };
  financialLoss?: { amount: number; currency: "INR" };
  evidence: string[];            // File storage IDs
  status: "submitted" | "investigating" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;           // FK → Police officer ID
  occurredAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5.4 ThreatAnalysis

```typescript
interface ThreatAnalysis {
  id: string;                    // UUID
  citizenId: string;             // FK → Citizen.id
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  inputContent: string;          // Original scanned content (encrypted at rest)
  riskScore: number;             // 0-100
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  threats: ThreatIndicator[];
  recommendation: string;
  confidence: number;            // 0-1
  aiModel: string;               // Model version used for analysis
  processingTime: number;        // milliseconds
  createdAt: string;
}

interface ThreatIndicator {
  category: string;
  confidence: number;
  description: string;
  indicators: string[];
}
```

### 5.5 Notification

```typescript
interface Notification {
  id: string;                    // UUID
  citizenId: string;             // FK → Citizen.id
  type: "threat_alert" | "report_update" | "security_tip" | "system" | "scan_complete";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  isRead: boolean;
  actionUrl?: string;            // Deep link to relevant page
  relatedEntityId?: string;      // FK → Report.id or ThreatAnalysis.id
  createdAt: string;
  readAt?: string;
}
```

### 5.6 RiskScore

```typescript
interface RiskScore {
  id: string;                    // UUID
  analysisId: string;            // FK → ThreatAnalysis.id
  overall: number;               // 0-100
  breakdown: {
    contentRisk: number;         // NLP-based text analysis score
    sourceRisk: number;          // Sender/domain reputation score
    patternRisk: number;         // Known attack pattern match score
    communityRisk: number;       // Community reports correlation score
  };
  factors: string[];             // Human-readable risk factor descriptions
  calculatedAt: string;
}
```

### 5.7 ScanHistory

```typescript
interface ScanHistory {
  id: string;                    // UUID
  citizenId: string;             // FK → Citizen.id
  analysisId: string;            // FK → ThreatAnalysis.id
  scanType: "message" | "url" | "qr" | "upi" | "voice";
  contentPreview: string;        // Truncated/masked preview (max 100 chars)
  riskScore: number;
  riskLevel: string;
  isFlagged: boolean;            // User manually flagged for follow-up
  createdAt: string;
}
```

### 5.8 SavedWebsite

```typescript
interface SavedWebsite {
  id: string;                    // UUID
  analysisId: string;            // FK → ThreatAnalysis.id
  url: string;
  domain: string;
  screenshotUrl?: string;        // Stored screenshot reference
  ssl: { valid: boolean; issuer: string; expiry: string };
  redirectChain: { url: string; statusCode: number }[];
  domainAge: string;             // ISO duration
  reputation: number;            // 0-100
  lastChecked: string;
}
```

### 5.9 Profile

```typescript
interface Profile {
  citizenId: string;             // FK → Citizen.id (1:1 relation)
  displayName: string;
  bio?: string;
  location?: string;
  securityScore: number;         // Gamified score based on activity
  badges: Badge[];
  stats: {
    totalScans: number;
    threatsBlocked: number;
    reportsSubmitted: number;
    streakDays: number;          // Consecutive days active
  };
  updatedAt: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}
```

### Entity Relationship Diagram (Text)

```
Citizen (1) ─── (1) Profile
Citizen (1) ─── (N) ThreatAnalysis
Citizen (1) ─── (N) Report
Citizen (1) ─── (N) Notification
Citizen (1) ─── (N) ScanHistory
ThreatAnalysis (1) ─── (1) RiskScore
ThreatAnalysis (1) ─── (0..1) SavedWebsite
ThreatAnalysis (1) ─── (N) ThreatIndicator (embedded)
ThreatAnalysis (0..1) ─── (0..1) Threat
ScanHistory (N) ─── (1) ThreatAnalysis
Report (0..1) ─── (0..1) Threat
```

---

## 6. Component Hierarchy

### Component Tree

```
DashboardLayout (existing: src/components/layouts/DashboardLayout.tsx)
├── Sidebar (existing: src/components/layouts/Sidebar.tsx)
├── TopBar (existing: src/components/layouts/TopBar.tsx)
└── <main> (page content)
    └── CitizenDashboardPage
        ├── WidgetGrid
        │   ├── WidgetCard (Threat Status)
        │   │   └── ThreatLevelIndicator
        │   ├── WidgetCard (Quick Actions)
        │   │   └── QuickAction × 6
        │   ├── WidgetCard (Recent Reports)
        │   │   └── ReportListItem × 5
        │   ├── WidgetCard (Recent Analysis)
        │   │   └── AnalysisListItem × 5
        │   ├── WidgetCard (Threat Timeline)
        │   │   └── TimelineChart
        │   ├── WidgetCard (Security Tips)
        │   │   └── TipCarousel
        │   ├── WidgetCard (AEGIS Assistant)
        │   │   └── AIResponse
        │   └── WidgetCard (Notifications)
        │       └── NotificationCard × N
        └── ScannerPage
            ├── ScanTypeSelector
            ├── ScanInputArea
            ├── AnalysisPanel
            │   ├── RiskScoreDisplay
            │   ├── ThreatList
            │   └── RecommendationCard
            └── HistoryTable
```

### Component Specifications

#### 6.1 DashboardLayout

| Property | Value |
|----------|-------|
| **Purpose** | Top-level layout shell providing sidebar, topbar, and content area |
| **Props** | `{ role: "citizen" \| "police" \| "organization"; children: ReactNode }` |
| **Children** | Sidebar, TopBar, page content via `children` |
| **State Dependencies** | `useAuthStore` (user role), `useUIStore` (sidebar collapsed state) |
| **File** | `src/components/layouts/DashboardLayout.tsx` (exists) |

#### 6.2 WidgetCard

| Property | Value |
|----------|-------|
| **Purpose** | Generic container for dashboard widgets with consistent styling and loading states |
| **Props** | `{ title: string; icon?: ReactNode; action?: ReactNode; isLoading?: boolean; span?: number; children: ReactNode }` |
| **Children** | Widget-specific content |
| **State Dependencies** | None (presentational) |
| **File** | `src/components/dashboard/WidgetCard.tsx` (new) |

#### 6.3 QuickAction

| Property | Value |
|----------|-------|
| **Purpose** | Individual action button that launches a scanner or report workflow |
| **Props** | `{ label: string; icon: ReactNode; href: string; color?: string; description?: string }` |
| **Children** | None (leaf component) |
| **State Dependencies** | None (navigational) |
| **File** | `src/components/dashboard/QuickAction.tsx` (new) |

#### 6.4 AnalysisPanel

| Property | Value |
|----------|-------|
| **Purpose** | Display scan analysis results with risk visualization and recommendations |
| **Props** | `{ result: AnalysisResult; onNewScan: () => void; onReport: () => void }` |
| **Children** | RiskScoreDisplay, ThreatList, RecommendationCard |
| **State Dependencies** | `useScannerStore` (current result) |
| **File** | `src/components/scanner/AnalysisPanel.tsx` (new) |

#### 6.5 HistoryTable

| Property | Value |
|----------|-------|
| **Purpose** | Paginated table displaying scan and report history with filtering |
| **Props** | `{ type?: "scans" \| "reports" \| "all"; limit?: number; showPagination?: boolean }` |
| **Children** | Table rows (HistoryRow), Pagination controls, Filter bar |
| **State Dependencies** | `useHistoryStore` (items, pagination, filters) |
| **File** | `src/components/history/HistoryTable.tsx` (new) |

#### 6.6 NotificationCard

| Property | Value |
|----------|-------|
| **Purpose** | Individual notification display with read/dismiss actions |
| **Props** | `{ notification: Notification; onDismiss: (id: string) => void; onRead: (id: string) => void }` |
| **Children** | None (leaf component) |
| **State Dependencies** | `useNotificationStore` (mark as read) |
| **File** | `src/components/notifications/NotificationCard.tsx` (new) |

#### 6.7 AIResponse

| Property | Value |
|----------|-------|
| **Purpose** | Render AEGIS AI chat messages with streaming text and typing indicator |
| **Props** | `{ messages: ChatMessage[]; isStreaming: boolean; onSend: (msg: string) => void }` |
| **Children** | MessageBubble × N, TypingIndicator, ChatInput |
| **State Dependencies** | `useAIStore` (future — chat history, streaming state) |
| **File** | `src/components/aegis/AIResponse.tsx` (new) |

---

## 7. State Management

### Store Architecture

Built on **Zustand 5** with the existing store pattern. All stores use the `create` function from Zustand and are exported from `src/store/index.ts`.

```
src/store/
├── index.ts          (barrel export — existing)
├── auth.ts           (existing — extend)
├── ui.ts             (existing — extend)
├── notifications.ts  (existing — extend)
├── dashboard.ts      (new)
├── scanner.ts        (new)
├── history.ts        (new)
└── ai.ts             (new — future)
```

### 7.1 Authentication Store (extend existing)

```typescript
interface AuthState {
  // Existing
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Extensions
  token: string | null;
  refreshToken: string | null;
  setTokens: (token: string, refreshToken: string) => void;
  clearTokens: () => void;
}
```
**Persistence:** `localStorage` for tokens (httpOnly cookies preferred in production)
**Selectors:** `isAuthenticated`, `userRole`, `userId`

### 7.2 Dashboard Store (new)

```typescript
interface DashboardState {
  threatLevel: "safe" | "elevated" | "high";
  recentScans: ScanHistoryItem[];
  recentReports: ReportHistoryItem[];
  stats: { totalScans: number; threatsBlocked: number; reportsSubmitted: number };
  isLoading: boolean;
  lastRefresh: string | null;

  // Actions
  fetchDashboardData: () => Promise<void>;
  refreshWidget: (widget: string) => Promise<void>;
  setThreatLevel: (level: "safe" | "elevated" | "high") => void;
}
```
**Persistence:** None (always fresh from API)
**Selectors:** `threatLevel`, `hasRecentThreats`, `dashboardReady`

### 7.3 Scanner Store (new)

```typescript
interface ScannerState {
  scanType: "message" | "url" | "qr" | "upi" | "voice" | null;
  input: string;
  isScanning: boolean;
  progress: number;              // 0-100 for loading states
  result: AnalysisResult | null;
  error: string | null;

  // Actions
  setScanType: (type: ScannerState["scanType"]) => void;
  setInput: (input: string) => void;
  startScan: () => Promise<void>;
  clearResult: () => void;
  reset: () => void;
}
```
**Persistence:** None (transient scan state)
**Selectors:** `isReady` (has type + input), `hasResult`, `riskLevel`

### 7.4 History Store (new)

```typescript
interface HistoryState {
  items: (ScanHistoryItem | ReportHistoryItem)[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  filters: { type: "scans" | "reports" | "all"; range: string; sortBy: string };
  isLoading: boolean;

  // Actions
  fetchHistory: (params?: Partial<HistoryQueryParams>) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}
```
**Persistence:** None
**Selectors:** `filteredItems`, `hasMore`, `isEmpty`

### 7.5 Notifications Store (extend existing)

```typescript
interface NotificationState {
  // Existing (extend from current useNotificationStore)
  notifications: Notification[];
  unreadCount: number;

  // Extensions
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  addNotification: (notification: Notification) => void;  // For WebSocket push
}
```
**Persistence:** None (server is source of truth)
**Selectors:** `unreadNotifications`, `unreadCount`, `criticalAlerts`

### 7.6 Theme Store (part of existing UI store)

```typescript
interface UIState {
  // Existing
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Extensions
  theme: "dark" | "light" | "system";
  resolvedTheme: "dark" | "light";
  setTheme: (theme: "dark" | "light" | "system") => void;
  mobileMenuOpen: boolean;
  setMobileMenu: (open: boolean) => void;
}
```
**Persistence:** `localStorage` for theme preference
**Selectors:** `effectiveTheme`, `isMobileMenuOpen`

### 7.7 AI Store (future)

```typescript
interface AIState {
  messages: ChatMessage[];
  isStreaming: boolean;
  sessionId: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  startSession: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
```
**Persistence:** `sessionStorage` (cleared on tab close)
**Selectors:** `lastMessage`, `hasActiveSession`

---

## 8. Navigation Architecture

### Sidebar Navigation (Desktop)

| Item | Label | Icon | Route | Active Detection |
|------|-------|------|-------|------------------|
| 1 | Dashboard | `Home` | `/citizen-dashboard` | `pathname === "/citizen-dashboard"` |
| 2 | Threat Scanner | `Scan` | `/scan` | `pathname.startsWith("/scan")` |
| 3 | History | `Clock` | `/threats` | `pathname === "/threats"` |
| 4 | Reports | `FileText` | `/reports` | `pathname === "/reports"` |
| 5 | AEGIS | `Bot` | `/aegis` | `pathname === "/aegis"` |
| 6 | Settings | `Settings` | `/citizen-settings` | `pathname === "/citizen-settings"` |
| 7 | Profile | `User` | `/citizen-settings?tab=profile` | `searchParams.get("tab") === "profile"` |

### Mobile Bottom Tab Bar

On screens below `lg` breakpoint, navigation collapses to a bottom tab bar with 5 primary items:

| Position | Label | Icon | Route |
|----------|-------|------|-------|
| 1 | Home | `Home` | `/citizen-dashboard` |
| 2 | Scan | `Scan` | `/scan` |
| 3 | History | `Clock` | `/threats` |
| 4 | Reports | `FileText` | `/reports` |
| 5 | More | `Menu` | Opens drawer with AEGIS, Settings, Profile |

### Navigation Behavior Rules

- Active item uses `bg-[rgba(236,154,163,0.08)]` background with `text-[#F8F8FA]` color
- Inactive items use `text-[#B6B8C4]` with hover state `hover:bg-[rgba(236,154,163,0.04)]`
- AEGIS status indicator always visible in sidebar footer (green dot = active)
- Mobile drawer slides from bottom with backdrop blur

---

## 9. Success Metrics

### Metric Definitions

| Metric | Unit | Target | Data Source | Collection Method |
|--------|------|--------|-------------|-------------------|
| Average Analysis Time | milliseconds | < 3000ms | `ThreatAnalysis.processingTime` | Server-side timing, returned in API response |
| Threat Detection Confidence | percentage (0-100) | > 85% | `ThreatAnalysis.confidence` | AI model output, tracked per scan |
| Scans Completed | count | 1000/day (platform-wide) | `ScanHistory` table count | Aggregated daily via scheduled job |
| Reports Submitted | count | 50/day (platform-wide) | `Report` table count | Aggregated daily via scheduled job |

### Dashboard Metrics Display

Metrics are surfaced to users in two locations:

1. **Profile Stats Card** — Personal cumulative metrics:
   - Total scans performed
   - Threats blocked (scans with riskLevel ≥ "high")
   - Reports submitted
   - Security score (gamified composite)

2. **Threat Status Widget** — Real-time platform metrics:
   - Current threat level (aggregated from recent community scans)
   - Last scan timestamp
   - Protection status (active/inactive based on last 7 days of activity)

### Metric Collection Architecture

```
User Action → API Endpoint → Business Logic → DB Write → Aggregation Job → Metrics Store
                                                              ↓
                                                    Dashboard Widget (polling)
                                                              ↓
                                                    Profile Stats (on-demand)
```

### Performance Budgets

| Measurement | Budget |
|-------------|--------|
| Dashboard first paint (cached) | < 1.5s |
| Dashboard first paint (cold) | < 3.0s |
| Scan result display | < 5.0s (end-to-end including AI) |
| Navigation transition | < 300ms |
| Widget refresh | < 1.0s |

---

## Appendix: File Structure (Planned)

```
src/
├── app/(citizen)/
│   ├── citizen-dashboard/page.tsx    (Dashboard with widgets)
│   ├── scan/page.tsx                 (Scanner module)
│   ├── threats/page.tsx              (History view)
│   ├── reports/page.tsx              (Reports list + create)
│   ├── aegis/page.tsx                (Full AEGIS chat — new)
│   ├── citizen-settings/page.tsx     (Settings + Profile tabs)
│   └── layout.tsx                    (DashboardLayout wrapper)
├── components/
│   ├── dashboard/
│   │   ├── WidgetCard.tsx
│   │   ├── WidgetGrid.tsx
│   │   ├── QuickAction.tsx
│   │   ├── ThreatStatusWidget.tsx
│   │   ├── TimelineChart.tsx
│   │   └── SecurityTips.tsx
│   ├── scanner/
│   │   ├── ScanTypeSelector.tsx
│   │   ├── ScanInputArea.tsx
│   │   ├── AnalysisPanel.tsx
│   │   ├── RiskScoreDisplay.tsx
│   │   └── RecommendationCard.tsx
│   ├── history/
│   │   ├── HistoryTable.tsx
│   │   └── HistoryFilters.tsx
│   ├── notifications/
│   │   └── NotificationCard.tsx
│   ├── aegis/
│   │   ├── AIResponse.tsx
│   │   ├── ChatInput.tsx
│   │   └── MessageBubble.tsx
│   └── reports/
│       ├── ReportForm.tsx
│       └── ReportCard.tsx
├── store/
│   ├── auth.ts         (extend)
│   ├── ui.ts           (extend)
│   ├── notifications.ts (extend)
│   ├── dashboard.ts    (new)
│   ├── scanner.ts      (new)
│   ├── history.ts      (new)
│   └── ai.ts           (new)
├── services/api/
│   ├── client.ts       (existing)
│   ├── citizen.ts      (extend with new endpoints)
│   └── aegis.ts        (new)
└── types/
    ├── index.ts        (extend)
    ├── api.ts          (new — request/response types)
    └── models.ts       (new — data model interfaces)
```
