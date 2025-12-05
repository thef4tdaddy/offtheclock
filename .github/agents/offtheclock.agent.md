---
name: OffTheClock Development Agent
description: GitHub Copilot Agent for OffTheClock - Time tracking and management application
---

# Rules

## Git & GitHub Workflow
Always follow the git workflow for commits and branches.

- Run Prettier before committing: `npm run format`
- Create a git commit when requested using conventional commits
- For commits: use imperative mood, be specific about changes
- Push to 'main' only for doc updates or error fixes
- For new features: create a feature branch, make PR, connect to issues
- Check existing issues and link commits to them
- Use commit message format: 'type: description' (e.g., 'fix: resolve lint errors')
- Do NOT commit files with secrets (.env, credentials.json, etc)
- CRITICAL: GitHub workflow files (.github/workflows/*.yml) must be committed separately and cherry-picked to main to actually run

## Architecture: OffTheClock

### Data Flow Architecture
Follow the critical data flow pattern:
**Python Backend (Neon) ↔ idb-keyval (Local Cache) ↔ TanStack Query (Server State) ↔ React Components**

- All external data flows through the Python Backend
- Local data persists in idb-keyval for offline capability
- TanStack Query manages ALL server state caching and synchronization
- Components receive data from TanStack Query hooks ONLY

## State Management Rules
- **TanStack Query (@tanstack/react-query)**: ALL server state, API calls, caching
- **React Context**: Global application state (Auth, Theme, User Preferences)
- **React State (useState/useReducer)**: Local UI state (modals, forms, temporary interactions)
- **CRITICAL**: Never put server data in Context or State - use TanStack Query
- **CRITICAL**: Auth state belongs in AuthContext
- **Pattern**: useQuery for reads, useMutation for writes

## Directory Structure & Rules
- `/src/components/` - UI ONLY, zero business logic, zero API calls, pure presentation
- `/src/services/` - ALL business logic, API calls, data processing, service layer
- `/src/hooks/` - Custom hooks (api/ for query hooks, common/ for logic)
- `/src/utils/` - Pure utility functions, validation, formatting, helpers
- `/src/contexts/` - React contexts (AuthContext, ThemeContext)
- `/src/types/` - TypeScript type definitions and interfaces
- `/src/constants/` - Application constants and enums

## CRITICAL RULES - ZERO TOLERANCE
### 🚫 NO ANY TYPES - EVER
**CRITICAL: ZERO tolerance for 'any' types in TypeScript**

- ABSOLUTELY NO 'any' types in ANY file - this is non-negotiable
- Use proper TypeScript types or interfaces for ALL variables
- If type is unknown: use unknown, type guards, or `z.infer<>`
- Use Zod schemas to validate and infer types from unknown data
- Code review will REJECT any commits with 'any' types

## Code Quality Standards
- TypeScript strict mode enabled - use proper types ONLY
- No unused variables - use underscore prefix if intentional: `const _unused = value`
- Max 200 lines per component (extract logic to hooks/utils)
- Max 300 lines per service (split into focused services)

## Naming Conventions
- **Components**: PascalCase (UserProfile.tsx)
- **Hooks**: camelCase with 'use' prefix (useUserProfile.ts)
- **Utils/Services**: camelCase (userProfileUtils.ts, userProfileService.ts)
- **Constants**: UPPER_SNAKE_CASE (USER_PROFILE_MAX_LENGTH)
- **Types/Interfaces**: PascalCase (UserProfile, UserProfileProps)

## Type Safety with Zod
- Use Zod schemas for all data validation from Backend
- All API responses must be validated with Zod schemas
- Use `z.infer<typeof Schema>` for type inference
- All service layer methods should return validated types

## React Component Patterns
- Functional components only (no class components)
- Use hooks: useState, useEffect, useMemo, useCallback, useContext
- Props must be typed: `interface ComponentProps { ... }`
- Extract large effects into custom hooks
- Use React.memo for expensive components
- Pattern: separate presentation from logic using custom hooks
- Components must not call APIs directly

## API & Service Layer
- All API calls must be in `/src/services/`
- Never call API methods from components directly
- Use TanStack Query for all data fetching
- Pattern: Create service method → wrap with TanStack Query hook → use in component
- All API operations must be validated with Zod

# Development Workflow
- Create feature branch from develop or main: `git checkout -b feature/description`
- Make focused commits with clear messages
- Request review before merging

## Commit Message Format
```
type: brief description

[optional] longer explanation of changes

Fixes #issue-number (if applicable)
```

# Prohibited
- 🚫 NO 'any' types - EVER - use proper types or Zod schemas
- No console.log() - use logger utility if available
- No business logic in components
- No direct API calls in components
- No server data in Context/State
- No mixed concerns (keep separation of concerns)
