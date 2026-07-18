# Requirements Document

## Introduction

The Unified Evidence Intelligence System enables citizens using CyberShield AI to upload digital evidence (images, screenshots, PDFs) for AI-powered analysis. The system leverages NVIDIA Vision AI to extract threat indicators — including logos, phone numbers, emails, UPI IDs, URLs, QR codes, bank names, government branding, suspicious wording, and spoofing patterns — from uploaded files. Results are stored, deduplicated, and accessible through both the API and the AEGIS assistant.

## Glossary

- **Evidence_Service**: The backend service responsible for processing evidence uploads, invoking AI analysis, and managing stored results.
- **Vision_Analyzer**: The NVIDIA Vision AI integration component that extracts entities and threat signals from images.
- **File_Validator**: The component responsible for validating uploaded file type, size, and integrity before processing.
- **Deduplication_Engine**: The component that computes file hashes and detects previously analyzed identical content.
- **Evidence_Store**: The database layer (Prisma + Neon PostgreSQL) that persists evidence metadata, extracted entities, and analysis results.
- **AEGIS_Assistant**: The existing AI chat assistant that provides contextual cybersecurity guidance to citizens.
- **Upload_Interface**: The frontend drag-and-drop component for file selection, preview, and upload submission.
- **PDF_Processor**: The component that handles PDF files by extracting images per page for vision analysis or extracting text for text-based analysis.
- **Citizen**: An authenticated user with the CITIZEN role who uploads evidence for analysis.
- **Evidence_Record**: A single stored analysis result comprising file metadata, extracted entities, vision summary, and threat score.

## Requirements

### Requirement 1: File Upload and Validation

**User Story:** As a Citizen, I want to upload digital evidence files so that they can be analyzed for cyber threat indicators.

#### Acceptance Criteria

1. WHEN a Citizen uploads a file, THE File_Validator SHALL accept files with MIME types image/png, image/jpeg, image/webp, and application/pdf only.
2. WHEN a Citizen uploads a file exceeding 10 megabytes, THE File_Validator SHALL reject the upload and return an error indicating the maximum allowed size.
3. WHEN a Citizen uploads a file with a valid type and size, THE Evidence_Service SHALL store the file content as base64 encoding for processing.
4. IF a Citizen uploads a file with a corrupted or unreadable format, THEN THE File_Validator SHALL return an error describing the file integrity failure.
5. WHEN a Citizen uploads a file, THE Evidence_Service SHALL extract and store the original filename, MIME type, and file size in bytes alongside the Evidence_Record.

### Requirement 2: NVIDIA Vision Analysis for Images

**User Story:** As a Citizen, I want uploaded images analyzed by AI so that hidden threat indicators and scam patterns are detected automatically.

#### Acceptance Criteria

1. WHEN an image file passes validation, THE Vision_Analyzer SHALL analyze the image and extract the following entity types: logos, phone numbers, email addresses, UPI IDs, URLs, QR codes, bank names, government branding elements, suspicious wording, payment requests, fake urgency indicators, and spoofing indicators.
2. WHEN the Vision_Analyzer completes analysis, THE Evidence_Service SHALL store the extracted entities as structured JSON in the Evidence_Record.
3. WHEN the Vision_Analyzer completes analysis, THE Evidence_Service SHALL generate and store a threat score between 0 and 100 for the Evidence_Record.
4. WHEN the Vision_Analyzer completes analysis, THE Evidence_Service SHALL store a human-readable summary describing the findings.
5. IF the Vision_Analyzer fails to respond within 30 seconds, THEN THE Evidence_Service SHALL return a timeout error to the Citizen.
6. IF the Vision_Analyzer returns an error or empty response, THEN THE Evidence_Service SHALL return an analysis failure error without storing a partial result.

### Requirement 3: PDF Processing

**User Story:** As a Citizen, I want to upload PDF documents so that both image-based and text-based PDF content is analyzed for threats.

#### Acceptance Criteria

1. WHEN a PDF file containing embedded images is uploaded, THE PDF_Processor SHALL extract each page as an image and submit each page image to the Vision_Analyzer for analysis.
2. WHEN a PDF file containing only text is uploaded, THE PDF_Processor SHALL extract the text content and submit the text to the Evidence_Service for text-based threat analysis.
3. WHEN a multi-page PDF is processed, THE Evidence_Service SHALL combine all page-level results into a single consolidated Evidence_Record with one overall threat score and summary.
4. IF a PDF file is malformed or cannot be parsed, THEN THE PDF_Processor SHALL return an error indicating the PDF is invalid or corrupted.

### Requirement 4: Evidence Storage and Persistence

**User Story:** As a Citizen, I want my evidence analysis results stored so that I can retrieve them at any time.

#### Acceptance Criteria

1. THE Evidence_Store SHALL persist each Evidence_Record with the following fields: original filename, MIME type, file size in bytes, storage path or base64 reference, extracted entities as JSON, vision summary text, threat score, analysis timestamp, and a relation to the owning User.
2. WHEN a new Evidence_Record is created, THE Evidence_Store SHALL associate the record with the authenticated Citizen who uploaded the file.
3. THE Evidence_Store SHALL add new database models and fields without removing or modifying any existing columns or tables in the Prisma schema.
4. WHEN a Citizen requests deletion of an Evidence_Record, THE Evidence_Store SHALL remove the record and associated stored data.

### Requirement 5: File Deduplication

**User Story:** As a Citizen, I want duplicate uploads to return cached results so that I do not wait for redundant analysis.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Deduplication_Engine SHALL compute a SHA-256 hash of the file content.
2. WHEN the computed hash matches an existing Evidence_Record for the same Citizen, THE Evidence_Service SHALL return the cached analysis result without invoking the Vision_Analyzer.
3. WHEN the computed hash does not match any existing record for the Citizen, THE Evidence_Service SHALL proceed with full analysis.
4. THE Deduplication_Engine SHALL store the file hash as part of the Evidence_Record for future comparisons.

### Requirement 6: AEGIS Assistant Integration

**User Story:** As a Citizen, I want AEGIS to reference my uploaded evidence analysis when I ask about it so that I get contextual answers without triggering redundant API calls.

#### Acceptance Criteria

1. WHEN a Citizen asks the AEGIS_Assistant about uploaded files or evidence, THE AEGIS_Assistant SHALL retrieve stored Evidence_Records for that Citizen and include relevant analysis data in its response context.
2. THE AEGIS_Assistant SHALL use stored evidence analysis data without re-invoking the Vision_Analyzer for previously analyzed files.
3. WHEN a Citizen has no stored Evidence_Records, THE AEGIS_Assistant SHALL inform the Citizen that no evidence has been uploaded yet.

### Requirement 7: API Endpoints

**User Story:** As a Citizen, I want RESTful API endpoints to upload, list, retrieve, and delete evidence so that the frontend can interact with the Evidence_Service.

#### Acceptance Criteria

1. THE Evidence_Service SHALL expose a POST /api/v1/evidence/upload endpoint that accepts multipart file uploads and returns the analysis result.
2. THE Evidence_Service SHALL expose a GET /api/v1/evidence endpoint that returns a paginated list of the authenticated Citizen's Evidence_Records.
3. THE Evidence_Service SHALL expose a GET /api/v1/evidence/:id endpoint that returns the full details of a single Evidence_Record belonging to the authenticated Citizen.
4. THE Evidence_Service SHALL expose a DELETE /api/v1/evidence/:id endpoint that removes an Evidence_Record belonging to the authenticated Citizen.
5. WHEN a request is made without a valid JWT token, THE Evidence_Service SHALL reject the request with an authentication error.
6. WHEN a Citizen attempts to access or delete an Evidence_Record belonging to another user, THE Evidence_Service SHALL reject the request with an authorization error.

### Requirement 8: Frontend Upload Interface

**User Story:** As a Citizen, I want a visual interface to drag and drop files, preview them, and view analysis results so that the experience is intuitive.

#### Acceptance Criteria

1. THE Upload_Interface SHALL provide a drag-and-drop zone that accepts image and PDF files.
2. WHEN a Citizen selects or drops a file, THE Upload_Interface SHALL display a preview of the file (image thumbnail or PDF first-page preview).
3. WHEN a file is being uploaded and analyzed, THE Upload_Interface SHALL display a progress indicator showing the current processing state.
4. WHEN analysis completes, THE Upload_Interface SHALL display the extracted entities, threat score, risk level, and summary in a structured result viewer.
5. THE Upload_Interface SHALL integrate with the existing CyberShield AI dashboard navigation and history views.
6. WHEN file validation fails on the client side, THE Upload_Interface SHALL display an inline error message describing the issue before submitting.

### Requirement 9: Error Handling

**User Story:** As a Citizen, I want clear error messages for all failure scenarios so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN a Citizen uploads an unsupported file type, THE Evidence_Service SHALL return an error specifying the allowed file types.
2. WHEN a Citizen uploads a file exceeding the size limit, THE Evidence_Service SHALL return an error specifying the maximum allowed size of 10 megabytes.
3. IF the Vision_Analyzer request times out, THEN THE Evidence_Service SHALL return a timeout error advising the Citizen to retry.
4. IF the uploaded image is corrupted or unreadable by the Vision_Analyzer, THEN THE Evidence_Service SHALL return an error indicating the file could not be processed.
5. IF the uploaded PDF is invalid or malformed, THEN THE Evidence_Service SHALL return an error indicating the PDF could not be parsed.
6. IF the Evidence_Store encounters a database failure during persistence, THEN THE Evidence_Service SHALL return an internal error without exposing database details.
7. IF the NVIDIA AI provider is unreachable or returns a provider-level failure, THEN THE Evidence_Service SHALL return a service unavailability error advising the Citizen to retry later.

### Requirement 10: Performance and Efficiency

**User Story:** As a Citizen, I want the system to avoid redundant processing so that my uploads are handled efficiently.

#### Acceptance Criteria

1. THE Deduplication_Engine SHALL prevent duplicate NVIDIA Vision API calls for file content that has already been analyzed for the same Citizen.
2. WHEN a cached result is returned due to deduplication, THE Evidence_Service SHALL respond within 500 milliseconds.
3. THE Evidence_Service SHALL process file hash computation before initiating any external API call.
