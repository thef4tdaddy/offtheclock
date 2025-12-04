# Changelog

## 0.1.0 (2025-12-04)


### Features

* add edit/delete functionality and flexible time input ([0f8cbec](https://github.com/thef4tdaddy/offtheclock/commit/0f8cbec863cb80f41295712468c520b7c67ab3c3))
* add interactive header and user profile fields with alembic migrations ([7a7d78c](https://github.com/thef4tdaddy/offtheclock/commit/7a7d78c713498981e2febf96b37fcb1758d1f9d7))
* add registration page ([c68f5c9](https://github.com/thef4tdaddy/offtheclock/commit/c68f5c958634cce4c5b4757ba7d60b6acfd470a5))
* complete initial implementation of pto tracker ([a449355](https://github.com/thef4tdaddy/offtheclock/commit/a449355f63a6343386c0b9ab173089aca4aa11ba))
* **frontend:** implement offline-first architecture with TanStack Query and Zod ([d1cc35a](https://github.com/thef4tdaddy/offtheclock/commit/d1cc35a934dba9081436a2ca721d6d62eaa24148))
* implement pto history and projections ([0e4225d](https://github.com/thef4tdaddy/offtheclock/commit/0e4225d645ca3202fd634ab2e690658d53ae3d55))
* **pto:** implement amazon pto logic with caps and grants ([2a81357](https://github.com/thef4tdaddy/offtheclock/commit/2a81357618f7bbb87434783a019bc077d1632da1))
* **settings:** refactor page, add amazon presets and profile editing ([044cecc](https://github.com/thef4tdaddy/offtheclock/commit/044cecc9681868dab0df1235afd5590756a37cd4))


### Bug Fixes

* add missing __init__.py files for python packages ([183f727](https://github.com/thef4tdaddy/offtheclock/commit/183f7272ab46de89a969a13029f79badea462b32))
* add SPA fallback routing to vercel.json ([2b7f53a](https://github.com/thef4tdaddy/offtheclock/commit/2b7f53abfbc5a6a914adc0e25bc76f9312aef050))
* **auth:** resolve 401 race condition ([8019dae](https://github.com/thef4tdaddy/offtheclock/commit/8019daee4ee80ab90aeb9924f0076aa31de447b8))
* move Vercel entry point to api/index.py ([e9f380a](https://github.com/thef4tdaddy/offtheclock/commit/e9f380a891cc64858d1a3976cd971703690b14c3))
* refactor API routing to remove /api prefix ([8b60c89](https://github.com/thef4tdaddy/offtheclock/commit/8b60c89848b52b7e53ff498ff74d08c9fd271a09))
* repair App.tsx syntax ([33a44e5](https://github.com/thef4tdaddy/offtheclock/commit/33a44e50b939562573e78c658d214317a7cc9765))
* revert API routing to use /api prefix (now that __init__.py is fixed) ([395b1ba](https://github.com/thef4tdaddy/offtheclock/commit/395b1ba2ab1378585ac81e45c5e22f3bed075b8c))
* set root_path to /api for Vercel deployment ([6f2e2de](https://github.com/thef4tdaddy/offtheclock/commit/6f2e2de54c62b89a2be9386b6f7434c71c943ac2))
