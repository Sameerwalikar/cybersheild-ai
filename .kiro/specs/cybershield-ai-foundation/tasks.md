# Implementation Plan: CyberShield AI — Engineering Foundation

## Overview

This plan establishes the complete monorepo scaffolding for CyberShield AI, including a Next.js 15 frontend, Express.js backend, shared tooling, and all configuration files. Tasks are ordered sequentially so each builds upon the previous, starting with root-level configs and progressing through frontend setup, backend setup, utilities, middleware, and final integration wiring.

## Tasks

- [ ] 1. Initialize root monorepo structure and shared configuration
  - [ ] 1.1 Create root package.json with concurrently dev script and workspace scripts
    - Create `package.json` at root with `name`, `private: true`, scripts: `dev` (concurrently runs frontend + backend), `build`, `lint`, `format`
    - Install `concurrently` as a dev dependency
    - _Requirements: 11.3_
  - [ ] 1.2 Create shared code quality configuration files
    - Create `.prettierrc` with `semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100`
    - Create `.editorconfig` with `indent_style = space`, `indent_size = 2`, `charset = utf-8`, `end_of_line = lf`, `trim_trailing_whitespace = true`, `insert_final_newline = true`
    - Create `.gitignore` covering `node_modules/`, `.next/`, `dist/`, `.env`, `.env.local`, `.env.development`, `.env.production`, `*.log`, `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/` (except shared settings), `coverage/`, `prisma/*.db`, `*.tsbuildinfo`
    - _Requirements: 12.1, 12.2, 12.4_
  - [ ] 1.3 Create README.md with project setup documentation
    - Include required Node.js version, package manager instructions, PostgreSQL setup, installation steps, environment variable configuration, and list of all available scripts with brief descriptions
    - _Requirements: 11.5_

- [ ] 2. Initialize frontend Next.js 15 project with TypeScript
  - [ ] 2.1 Create frontend package.json with all dependencies and scripts
    - Create `frontend/package.json` with Next.js 15, React 18+, TypeScript 5+ as dev dep
    - Include all required scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `type-check`
    - Include production dependencies: `@react-three/fiber`, `three`, `@react-three/drei`, `framer-motion`, `gsap`, `lucide-react`
    - Include dev dependencies: `@types/three`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `tailwindcss`, `postcss`, `autoprefixer`
    - _Requirements: 1.5, 3.1, 3.2, 3.3, 11.1_
  - [ ] 2.2 Create frontend TypeScript configuration with strict mode and path aliases
    - Create `frontend/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `exactOptionalPropertyTypes: true`
    - Configure path aliases: `@/*` → `./src/*`, plus explicit mappings for components, features, hooks, lib, services, store, types, utils, constants, config
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 2.3 Create Next.js and Tailwind CSS configuration files
    - Create `frontend/next.config.ts` with `reactStrictMode: true` and App Router config
    - Create `frontend/tailwind.config.ts` with content paths for all 12 src directories using `{ts,tsx,css}` glob patterns
    - Create `frontend/postcss.config.js` with tailwindcss and autoprefixer plugins
    - _Requirements: 1.1, 1.3_
  - [ ] 2.4 Create frontend ESLint configuration and Shadcn UI setup
    - Create `frontend/.eslintrc.json` extending `next/core-web-vitals` and `plugin:@typescript-eslint/recommended`
    - Create `frontend/components.json` for Shadcn UI configuration
    - _Requirements: 3.3, 3.4, 12.3_
  - [ ] 2.5 Create frontend environment example file
    - Create `frontend/.env.example` with `NEXT_PUBLIC_API_URL=`, `NEXT_PUBLIC_APP_NAME=`, `NEXT_PUBLIC_APP_VERSION=`, `NODE_ENV=`
    - _Requirements: 8.4_

- [ ] 3. Create frontend directory structure with barrel exports
  - [ ] 3.1 Create all 13 top-level src directories with barrel export files
    - Create directories: `app`, `components`, `features`, `hooks`, `lib`, `services`, `store`, `styles`, `types`, `utils`, `constants`, `config`, `assets`
    - Each directory gets an `index.ts` barrel export file
    - _Requirements: 2.1, 2.5_
  - [ ] 3.2 Create component library subdirectory structure
    - Create `frontend/src/components/` subdirectories: `shared`, `layout`, `ui`, `three`, `animations`, `navigation`
    - Each subdirectory gets a placeholder `index.ts` barrel export file
    - _Requirements: 2.2, 2.5_
  - [ ] 3.3 Create feature module directories for citizen, police, analytics, and _template
    - Create `frontend/src/features/_template/` with components, hooks, services, types subdirectories (each with `index.ts`)
    - Create `frontend/src/features/citizen/` with components, hooks, services, types subdirectories (each with `index.ts`)
    - Create `frontend/src/features/police/` with components, hooks, services, types subdirectories (each with `index.ts`)
    - Create `frontend/src/features/analytics/` with components, hooks, services, types subdirectories (each with `index.ts`)
    - _Requirements: 2.3, 2.4_
  - [ ] 3.4 Create root layout and page files for the App Router
    - Create `frontend/src/app/layout.tsx` exporting a default component with html and body elements wrapping children
    - Create `frontend/src/app/page.tsx` rendering a heading with identifiable text content (e.g., "CyberShield AI")
    - Create `frontend/src/styles/globals.css` with Tailwind directives
    - _Requirements: 1.2_

- [ ] 4. Implement frontend type definitions and constants
  - [ ] 4.1 Create TypeScript type definition files
    - Create `frontend/src/types/common.ts` exporting `BaseEntity`, `PaginatedResponse<T>`, `Nullable<T>`, `Optional<T>`
    - Create `frontend/src/types/api.ts` exporting `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>`, `RequestConfig`
    - Create `frontend/src/types/env.d.ts` declaring `NodeJS.ProcessEnv` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`, `NODE_ENV`
    - _Requirements: 4.4_
  - [ ] 4.2 Create constants registry files
    - Create `frontend/src/constants/routes.ts` exporting `ROUTES` frozen object with HOME, DASHBOARD, LOGIN, REGISTER paths
    - Create `frontend/src/constants/api.ts` exporting `API_ENDPOINTS` frozen object with HEALTH, AUTH endpoints
    - Create `frontend/src/constants/config.ts` exporting `APP_CONFIG` frozen object with APP_NAME, VERSION, DEFAULT_PAGE_SIZE
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ] 4.3 Create environment-aware configuration module
    - Create `frontend/src/config/environment.ts` exporting config that varies by `NODE_ENV` (different base URLs for development vs production)
    - _Requirements: 9.4_

- [ ] 5. Implement frontend utility modules and hooks
  - [ ] 5.1 Create API client library module
    - Create `frontend/src/lib/api-client.ts` exporting a pre-configured HTTP client with base URL from environment and default headers including `Content-Type: application/json`
    - _Requirements: 10.1_
  - [ ] 5.2 Create cn (class name merge) utility module
    - Create `frontend/src/lib/cn.ts` exporting a `cn` function that accepts variable `ClassValue` arguments (string | undefined | null | false) and returns a merged class name string
    - _Requirements: 10.1_
  - [ ] 5.3 Create date formatting utility module
    - Create `frontend/src/lib/date.ts` exporting `formatDate` and `formatRelativeTime` functions that accept Date inputs and return formatted strings
    - _Requirements: 10.1_
  - [ ] 5.4 Create placeholder custom hook
    - Create `frontend/src/hooks/useMediaQuery.ts` (or similar) that accepts optional parameters, uses `useState`/`useEffect` internally, and returns a typed value
    - _Requirements: 10.3_
  - [ ]* 5.5 Write property test for cn utility
    - **Property 7: Class name merge utility**
    - Test that for any array of inputs (string | undefined | null | false), the result contains no `undefined`/`null`/`false` literals, contains all non-empty strings separated by spaces, and has no leading/trailing whitespace
    - **Validates: Requirements 10.1**

- [ ] 6. Checkpoint - Verify frontend compiles
  - Ensure `tsc --noEmit` passes and `next build` produces no TypeScript errors. Ask the user if questions arise.

- [ ] 7. Initialize backend Express.js project with TypeScript and Prisma
  - [ ] 7.1 Create backend package.json with all dependencies and scripts
    - Create `backend/package.json` with Express.js, Prisma, TypeScript, and all dev dependencies
    - Include scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `db:generate`, `db:migrate`, `db:studio`
    - _Requirements: 5.1, 11.2_
  - [ ] 7.2 Create backend TypeScript configuration
    - Create `backend/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, target ES2020, `outDir: ./dist`, `rootDir: ./src`
    - _Requirements: 5.1_
  - [ ] 7.3 Create backend ESLint configuration
    - Create `backend/.eslintrc.json` extending `plugin:@typescript-eslint/recommended` with Node.js env globals and TypeScript parser
    - _Requirements: 12.3_
  - [ ] 7.4 Create Prisma schema and migrations directory
    - Create `backend/prisma/schema.prisma` with `provider = "postgresql"`, `url = env("DATABASE_URL")`, and Placeholder model with `id` (UUID), `createdAt`, `updatedAt`, `name`
    - Create empty `backend/prisma/migrations/` directory with `.gitkeep`
    - _Requirements: 5.3, 6.2_
  - [ ] 7.5 Create backend environment example file
    - Create `backend/.env.example` with PORT, NODE_ENV, DATABASE_URL, CORS_ORIGINS, JWT_SECRET, LOG_LEVEL
    - _Requirements: 8.4_

- [ ] 8. Create backend directory structure with barrel exports
  - [ ] 8.1 Create all 13 backend src directories with barrel export files
    - Create directories under `backend/src/`: controllers, routes, services, middlewares, config, database, utils, types, interfaces, validators, ai, graph, socket
    - Each directory gets an `index.ts` barrel export file
    - _Requirements: 6.1, 6.4_
  - [ ] 8.2 Create backend type definitions and interfaces
    - Create `backend/src/types/index.ts` exporting `ServiceConfig`, `AppError`
    - Create `backend/src/interfaces/index.ts` exporting `IBaseService`, `IController`
    - _Requirements: 6.1_
  - [ ] 8.3 Create backend server entry point with health check
    - Create `backend/src/index.ts` with Express app configured with JSON body parsing (10mb limit), CORS middleware, health-check at `GET /api/health` returning `{ status: "ok", timestamp: "<ISO8601>" }`, and port from `PORT` env (default 4000)
    - _Requirements: 5.2, 5.4_
  - [ ] 8.4 Create base controller template file
    - Create a typed controller function in `backend/src/controllers/` with explicit Request and Response type parameters, serving as a reference template
    - _Requirements: 6.3_

- [ ] 9. Implement backend middleware layer
  - [ ] 9.1 Create global error handling middleware
    - Implement middleware that catches unhandled errors and returns JSON with `success` (false), `message` (string), `statusCode` (number)
    - In development mode, include `stack` trace in response
    - In production mode, return generic message without exposing internal details
    - _Requirements: 7.1, 7.4, 7.5_
  - [ ] 9.2 Create request logging middleware
    - Implement middleware that logs HTTP method, URL path, response status code, and response time in milliseconds for every completed request
    - _Requirements: 7.2_
  - [ ] 9.3 Create CORS configuration middleware
    - Implement CORS middleware that reads allowed origins from `CORS_ORIGINS` environment variable, enabling per-environment origin control
    - _Requirements: 7.3_
  - [ ]* 9.4 Write property tests for error handling middleware
    - **Property 1: Error response structure invariant** — response always contains `success` (false), `message` (non-empty string), `statusCode` (100-599)
    - **Property 2: Error detail visibility by environment** — `stack` field present if and only if NODE_ENV is development
    - **Validates: Requirements 7.1, 7.4, 7.5**
  - [ ]* 9.5 Write property tests for request logging and CORS
    - **Property 3: Request logging completeness** — log entry always contains method, path, statusCode, responseTime
    - **Property 4: CORS origin enforcement** — Allow-Origin header present if and only if origin is in allowed set
    - **Validates: Requirements 7.2, 7.3**

- [ ] 10. Implement backend environment configuration
  - [ ] 10.1 Create environment configuration module with validation
    - Implement environment loader with precedence: `.env.local` > `.env.{NODE_ENV}` > `.env`
    - Implement `validateEnv` function that throws listing all missing required variables
    - Gracefully continue if a referenced env file doesn't exist
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 10.2 Wire environment validation into server startup
    - Call `validateEnv` at server start in `backend/src/index.ts` with all required variable names
    - _Requirements: 8.2_
  - [ ]* 10.3 Write property tests for environment configuration
    - **Property 5: Environment variable precedence** — resolved value equals highest-precedence file value
    - **Property 6: Required variable validation completeness** — error message contains every missing variable name and no present variables
    - **Validates: Requirements 8.1, 8.2**

- [ ] 11. Implement backend utility modules
  - [ ] 11.1 Create response formatter utility
    - Create `backend/src/utils/response.ts` exporting `formatResponse<T>(data, message?)` returning `{ success: true, data, message? }` and `formatError(message, statusCode?)` returning error response
    - _Requirements: 10.2_
  - [ ] 11.2 Create async handler utility
    - Create `backend/src/utils/async-handler.ts` exporting `asyncHandler` that wraps async route handlers and forwards rejected promises to `next()`
    - _Requirements: 10.2_
  - [ ] 11.3 Create validation helpers utility
    - Create `backend/src/utils/validation.ts` exporting `isNonEmptyString`, `isValidEmail`, `isValidUUID`
    - _Requirements: 10.2_
  - [ ] 11.4 Create base service class
    - Create `backend/src/services/base.service.ts` exporting a base service class (or abstract class) with constructor accepting config and overridable `initialize()`/`shutdown()` methods
    - _Requirements: 10.4_
  - [ ]* 11.5 Write property tests for response formatter and async handler
    - **Property 8: Response formatter structure** — returned object always has `success: true` and `data` equal to input; `message` present only when provided
    - **Property 9: Async handler error forwarding** — rejected promises always call `next` with the error
    - **Validates: Requirements 10.2**

- [ ] 12. Checkpoint - Verify backend compiles and health check responds
  - Ensure `tsc --noEmit` passes in backend, the server starts, and `GET /api/health` returns HTTP 200. Ask the user if questions arise.

- [ ] 13. Wire integration and final validation
  - [ ] 13.1 Verify root dev script runs both frontend and backend concurrently
    - Ensure `npm run dev` at root starts both Next.js (port 3000) and Express (port 4000) servers
    - _Requirements: 11.3_
  - [ ] 13.2 Verify frontend build produces .next output and backend build produces dist/
    - Run `npm run build` in frontend and backend, confirm output directories exist
    - _Requirements: 11.4_
  - [ ] 13.3 Verify lint passes clean on all generated files
    - Run `npm run lint` on both frontend and backend, confirm zero errors and zero warnings
    - _Requirements: 12.5_
  - [ ] 13.4 Verify path alias imports resolve correctly
    - Create a test import file that uses `@/types/common`, `@/constants/routes`, `@/lib/cn` and confirm `tsc --noEmit` passes
    - _Requirements: 4.5_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, both projects compile cleanly, and lint reports zero errors. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before moving to the next phase
- Property tests validate universal correctness properties defined in the design document (Properties 1-9)
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout, so all implementation tasks use TypeScript
- All 12 requirements are covered across the task list with full traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 9, "tasks": ["9.4", "9.5", "10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3", "11.4"] },
    { "id": 12, "tasks": ["11.5"] },
    { "id": 13, "tasks": ["13.1", "13.2", "13.3", "13.4"] }
  ]
}
```
