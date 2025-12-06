# Changelog

## [0.4.0](https://github.com/thef4tdaddy/offtheclock/compare/offtheclock-v0.3.1...offtheclock-v0.4.0) (2025-12-06)


### Features

* enhance shift management with series deletion and amazon preset integration ([4251a8c](https://github.com/thef4tdaddy/offtheclock/commit/4251a8c529974b0218d10ebb98d7b748cfd97e66))


### Bug Fixes

* **ci:** point to correct requirements.txt path in daily check ([1791577](https://github.com/thef4tdaddy/offtheclock/commit/179157706b3a22a812c12b21180882ff877297e5))
* **ci:** point to correct requirements.txt path in daily check ([378e8fc](https://github.com/thef4tdaddy/offtheclock/commit/378e8fc667bc2bbfdf1d6155eb5e72876b584c18))
* resolve merge conflicts between develop and main (deps + ci) ([870c1c2](https://github.com/thef4tdaddy/offtheclock/commit/870c1c29cd1ab4ba8d6f2bdd7190db236176d0e9))
* **tests:** resolve type errors in shift utility tests ([c831973](https://github.com/thef4tdaddy/offtheclock/commit/c8319733c0f0ff2dfe1e4930c7dd2d3b6a9c7205))

## [0.3.1](https://github.com/thef4tdaddy/offtheclock/compare/offtheclock-v0.3.0...offtheclock-v0.3.1) (2025-12-05)


### Bug Fixes

* **backend:** add robustness checks to pto calculation to prevent 500s ([177bdde](https://github.com/thef4tdaddy/offtheclock/commit/177bddedc3bab64f4ce6be63fa2ea8a4eeb70cec))
* **backend:** fix auth dependency crash by creating dependencies.py ([d31152a](https://github.com/thef4tdaddy/offtheclock/commit/d31152a96037cb7b0e6cb929d164ecf5e19c211b))
* **backend:** proper pto router refactor and lint config fix ([3229fdf](https://github.com/thef4tdaddy/offtheclock/commit/3229fdfe54c301cd4e925ea3e230108808ed1941))
* **backend:** remove duplicate avatar_url column in User model ([1921993](https://github.com/thef4tdaddy/offtheclock/commit/19219935b557ea6c38b0bc820e7d44a3722ac123))
* **backend:** resolve remaining AttributeError in shifts router (skip hooks) ([8f28de1](https://github.com/thef4tdaddy/offtheclock/commit/8f28de1812d291ed31526b0232bc52cb8d0e2d5f))

## [0.3.0](https://github.com/thef4tdaddy/offtheclock/compare/offtheclock-v0.2.0...offtheclock-v0.3.0) (2025-12-05)


### Features

* **schedule:** implement shift scheduling and auto-upt accrual ([4f564b7](https://github.com/thef4tdaddy/offtheclock/commit/4f564b71694bc09cc298793899b3b8a2315b4867))
* **ui:** implement UI/UX enhancements and Button component ([723770d](https://github.com/thef4tdaddy/offtheclock/commit/723770d7462f42d355ced547099747cf841a1ee4))


### Bug Fixes

* **assets:** remove vite.svg and sidebar icon to .ico ([c1c419a](https://github.com/thef4tdaddy/offtheclock/commit/c1c419a01db14cb47e3ad0045f3b71267c845ec1))
* **css:** remove legacy tailwind js config to unleash v4 css-first config ([2411e6b](https://github.com/thef4tdaddy/offtheclock/commit/2411e6b85900b9f05e7c30323a54fc67da4d4322))
* **css:** restore missing css variables and migrate to tailwind v4 [@theme](https://github.com/theme) ([3678fcf](https://github.com/thef4tdaddy/offtheclock/commit/3678fcf1cf18302d7313f1bb367e9d105f75dfe8))
* **runtime:** resolve DataCloneError and basic auth loop ([68e9aaa](https://github.com/thef4tdaddy/offtheclock/commit/68e9aaa7b190c0a394eccedb5b991e4ec36f19c7))
* **ui:** apply new Teal/Orange color palette and resolve inconsistencies ([98bb925](https://github.com/thef4tdaddy/offtheclock/commit/98bb9251740abfca35626d8659b7c0212d932638))
* **ui:** apply requested color palette and typography polish ([7d7fe31](https://github.com/thef4tdaddy/offtheclock/commit/7d7fe31f2119f478f1268bbd04850771aec8def4))
* **ui:** restore css colors and improve dev experience ([a257a77](https://github.com/thef4tdaddy/offtheclock/commit/a257a77514a06ed90b5877f1295afbe71687942a))

## [0.2.0](https://github.com/thef4tdaddy/offtheclock/compare/offtheclock-v0.1.0...offtheclock-v0.2.0) (2025-12-05)


### Features

* **arch:** implement service layer, hooks, and domain schemas ([38c101e](https://github.com/thef4tdaddy/offtheclock/commit/38c101e47a591550c4a9f86a95648470ef472bd1))


### Bug Fixes

* **frontend:** implement mobile hamburger menu ([0b92863](https://github.com/thef4tdaddy/offtheclock/commit/0b92863f800181f5f038f987cebe1c1b6b3f03ae))
* **frontend:** improve mobile responsiveness ([f46da59](https://github.com/thef4tdaddy/offtheclock/commit/f46da59caab9d201fcc86f8902084b5b372fe2f8))
* **pto:** automate flex pto ytd calculation ([fbb6ab8](https://github.com/thef4tdaddy/offtheclock/commit/fbb6ab834c01cb9ea3ad05755f756182f0f03861))

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
