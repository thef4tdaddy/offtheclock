# Off The Clock

A Paid Time Off (PTO) tracking and projection application. 

Originally designed to help **Amazon Warehouse Employees** manage their complex time-off options (UPT, PTO, Vacation), this application is flexible enough to be used by **anyone** who wants to track their balances, visualize future accruals, and plan time off with confidence.

## Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: TanStack Query (Server State)
- **Styling**: Tailwind CSS, Lucide React
- **Architecture**:
    - **Service Layer**: API interaction with Zod validation.
    - **Hooks Layer**: Custom hooks wrapping TanStack Query.
    - **Clean Root**: Configuration files are enforced to be in `frontend/configs/`.
- **Quality**: ESLint (Architectural Rules), Prettier.

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (SQLAlchemy + Alembic)
- **Quality**: Black (Formatter), Isort, Ruff, MyPy.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    cd offtheclock
    ```

2.  **Backend Setup**
    ```bash
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate

    # Install dependencies
    pip install -r requirements.txt

    # Run migrations (ensure DB is running and .env is set)
    alembic upgrade head

    # Start Server
    uvicorn app.main:app --reload
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    
    # Install dependencies
    npm install

    # Start Dev Server
    npm run dev
    ```

## Testing

### Backend Tests (pytest)

The backend uses pytest with comprehensive unit and integration tests:

```bash
cd backend

# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run specific test file
pytest tests/test_auth_endpoints.py
```

**Test Structure:**
- `tests/test_security.py` - Unit tests for password hashing and JWT tokens
- `tests/test_shifts_utils.py` - Unit tests for UPT accrual calculations
- `tests/test_auth_endpoints.py` - Integration tests for authentication endpoints
- `tests/test_shifts_endpoints.py` - Integration tests for shifts CRUD operations

**Test Database:**
Tests use an in-memory SQLite database with transaction rollback for isolation.

### Frontend Tests (Vitest)

The frontend uses Vitest with React Testing Library:

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode (for development)
npm test

# Run tests once (for CI)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

**Test Structure:**
- `src/utils/format.test.ts` - Unit tests for utility functions
- `src/components/common/Button.test.tsx` - Component tests for Button
- `src/test/test-utils.tsx` - Custom render function with providers

**Test Coverage:**
- Backend: 59% code coverage (43 tests passing)
- Frontend: 37 tests passing across utility and component tests

## Development Guidelines

### Frontend Architecture
We enforce a clean architecture in the frontend:
- **No Direct API Calls**: Components must **not** import `axios` directly. Use custom hooks (e.g., `useUser`, `usePTO`).
- **Strict Typing**: Usage of `any` is strictly prohibited. Use Zod schemas in `src/domain/schemas` for data validation.
- **Clean Root**: The `frontend` root directory is restricted. Do not add config files there; place them in `frontend/configs/`.

### Code Quality
Husky hooks are configured to automatically format and lint your code on commit.

- **Check Frontend**: `npm run lint` (inside frontend directory)
- **Check Backend**: `black .` / `isort .` (inside backend directory)

### Commit Convention
We use [Commitlint](https://commitlint.js.org/). Please follow the Conventional Commits specification:
- `feat(auth): add login page`
- `fix(api): resolve timeout issue`
- `chore: update dependencies`
