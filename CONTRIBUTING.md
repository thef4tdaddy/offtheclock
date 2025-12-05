# Contributing to Off The Clock

Thank you for your interest in contributing to Off The Clock! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
    ```bash
    git clone https://github.com/your-username/offtheclock.git
    cd offtheclock
    ```
3.  **Install Dependencies** (see [README.md](./README.md) for detailed setup).
4.  **Create a Branch** for your feature or fix.
    ```bash
    git checkout -b feat/my-amazing-feature
    ```

## Architecture & Code Standards

### Frontend Structure
We enforce a strict architecture to maintain scalability:
*   **Service Layer (`src/services`)**: Handle all API communication here. Use Zod schemas for validation.
    *   ❌ **DO NOT** use `axios` directly in components.
    *   ✅ **DO** use the defined services.
*   **Hooks Layer (`src/hooks`)**: Wrap services in TanStack Query hooks.
*   **Clean Root**: The `frontend/` root directory is restricted.
    *   ❌ **DO NOT** add new config files to the root.
    *   ✅ **DO** place them in `frontend/configs/`.

### strict Typing
*   Usage of `any` is strictly prohibited.
*   Ensure all new code is fully typed.

### Backend
*   Follow PEP 8 guidelines.
*   Use `black` and `isort` for formatting.

## Validation

Before submitting your changes, ensure they pass our automated checks.

**Frontend:**
```bash
cd frontend
npm run lint      # Runs ESLint and Root Enforcement check
npm run typecheck # Checks for TypeScript errors
npm run format    # Formats code with Prettier
```

**Backend:**
```bash
cd backend
black .
isort .
```

**Pre-commit Hooks:**
We use Husky to automatically run these checks on commit. If a commit fails, please fix the reported errors.

## Pull Request Process

1.  Ensure your code passes all validation checks.
2.  Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):
    *   `feat: ...` for new features
    *   `fix: ...` for bug fixes
    *   `docs: ...` for documentation
3.  Push to your fork and submit a Pull Request.
4.  Provide a clear description of your changes.

## Questions?

If you have any questions, feel free to open an issue or start a discussion.
