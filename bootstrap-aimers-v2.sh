#!/usr/bin/env bash

set -euo pipefail

echo
echo "Creating AIMERS OS V2..."
echo

# ============================================================
# HELPERS
# ============================================================

make_dirs() {
  for directory in "$@"; do
    mkdir -p "$directory"
  done
}

make_ts_file() {
  local file="$1"

  mkdir -p "$(dirname "$file")"

  if [ ! -e "$file" ]; then
    printf 'export {};\n' > "$file"
  fi
}

make_empty_file() {
  local file="$1"

  mkdir -p "$(dirname "$file")"
  touch "$file"
}

create_frontend_page() {
  local app="$1"
  local page="$2"
  local base="apps/${app}/src/pages/${page}"

  mkdir -p \
    "${base}/components" \
    "${base}/hooks" \
    "${base}/services" \
    "${base}/styles" \
    "${base}/types"

  make_ts_file "${base}/index.ts"
  make_ts_file "${base}/${page}.types.ts"
  make_ts_file "${base}/${page}.service.ts"
}

create_frontend_app() {
  local app="$1"
  local display_name="$2"

  make_dirs \
    "apps/${app}/public" \
    "apps/${app}/public/icons" \
    "apps/${app}/public/images" \
    "apps/${app}/src/app" \
    "apps/${app}/src/app/guards" \
    "apps/${app}/src/app/providers" \
    "apps/${app}/src/app/router" \
    "apps/${app}/src/app/shell" \
    "apps/${app}/src/assets" \
    "apps/${app}/src/assets/audio" \
    "apps/${app}/src/assets/fonts" \
    "apps/${app}/src/assets/icons" \
    "apps/${app}/src/assets/images" \
    "apps/${app}/src/assets/illustrations" \
    "apps/${app}/src/assets/logos" \
    "apps/${app}/src/assets/patterns" \
    "apps/${app}/src/components" \
    "apps/${app}/src/components/animations" \
    "apps/${app}/src/components/badges" \
    "apps/${app}/src/components/buttons" \
    "apps/${app}/src/components/cards" \
    "apps/${app}/src/components/charts" \
    "apps/${app}/src/components/command-palette" \
    "apps/${app}/src/components/data-display" \
    "apps/${app}/src/components/feedback" \
    "apps/${app}/src/components/forms" \
    "apps/${app}/src/components/icons" \
    "apps/${app}/src/components/inputs" \
    "apps/${app}/src/components/layout" \
    "apps/${app}/src/components/loaders" \
    "apps/${app}/src/components/modals" \
    "apps/${app}/src/components/navigation" \
    "apps/${app}/src/components/overlays" \
    "apps/${app}/src/components/progress" \
    "apps/${app}/src/components/tables" \
    "apps/${app}/src/components/typography" \
    "apps/${app}/src/config" \
    "apps/${app}/src/contexts" \
    "apps/${app}/src/data" \
    "apps/${app}/src/features" \
    "apps/${app}/src/hooks" \
    "apps/${app}/src/layouts" \
    "apps/${app}/src/lib" \
    "apps/${app}/src/pages" \
    "apps/${app}/src/providers" \
    "apps/${app}/src/routes" \
    "apps/${app}/src/services" \
    "apps/${app}/src/state" \
    "apps/${app}/src/store" \
    "apps/${app}/src/styles" \
    "apps/${app}/src/types" \
    "apps/${app}/src/utils"

  cat > "apps/${app}/package.json" <<EOF
{
  "name": "@aimers/${app}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "${display_name}",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

  cat > "apps/${app}/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src", "vite.config.ts"]
}
EOF

  cat > "apps/${app}/vite.config.ts" <<'EOF'
import { defineConfig } from "vite";

export default defineConfig({});
EOF

  cat > "apps/${app}/index.html" <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>${display_name}</title>
  </head>

  <body>
    <div id="root"></div>
    <script
      type="module"
      src="/src/main.tsx"
    ></script>
  </body>
</html>
EOF

  make_ts_file "apps/${app}/src/main.tsx"
  make_ts_file "apps/${app}/src/app/App.tsx"
  make_ts_file "apps/${app}/src/app/router/AppRouter.tsx"
  make_ts_file "apps/${app}/src/app/providers/AppProviders.tsx"
  make_ts_file "apps/${app}/src/app/shell/AppShell.tsx"
  make_ts_file "apps/${app}/src/layouts/AppLayout.tsx"
  make_ts_file "apps/${app}/src/layouts/AuthLayout.tsx"
  make_ts_file "apps/${app}/src/routes/route-config.ts"
  make_ts_file "apps/${app}/src/services/api-client.ts"
  make_ts_file "apps/${app}/src/store/index.ts"
  make_ts_file "apps/${app}/src/types/index.ts"

  make_empty_file "apps/${app}/src/styles/index.css"
  make_empty_file "apps/${app}/src/styles/reset.css"
  make_empty_file "apps/${app}/src/styles/globals.css"
  make_empty_file "apps/${app}/src/styles/animations.css"
  make_empty_file "apps/${app}/src/styles/utilities.css"
  make_empty_file "apps/${app}/.env.example"
}

create_api_module() {
  local module="$1"
  local base="apps/api/src/modules/${module}"

  mkdir -p "$base"

  make_ts_file "${base}/${module}.controller.ts"
  make_ts_file "${base}/${module}.service.ts"
  make_ts_file "${base}/${module}.repository.ts"
  make_ts_file "${base}/${module}.routes.ts"
  make_ts_file "${base}/${module}.schema.ts"
  make_ts_file "${base}/${module}.types.ts"
  make_ts_file "${base}/${module}.events.ts"
  make_ts_file "${base}/index.ts"
}

create_shared_package() {
  local package="$1"

  mkdir -p "packages/${package}/src"

  cat > "packages/${package}/package.json" <<EOF
{
  "name": "@aimers/${package}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

  cat > "packages/${package}/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
EOF

  make_ts_file "packages/${package}/src/index.ts"
}

create_python_service() {
  local service="$1"
  local service_name="${service//-/_}"
  local base="services/${service}"

  make_dirs \
    "${base}/src" \
    "${base}/src/api" \
    "${base}/src/config" \
    "${base}/src/core" \
    "${base}/src/evaluations" \
    "${base}/src/models" \
    "${base}/src/pipelines" \
    "${base}/src/prompts" \
    "${base}/src/repositories" \
    "${base}/src/services" \
    "${base}/src/tests" \
    "${base}/src/types" \
    "${base}/src/utils"

  cat > "${base}/pyproject.toml" <<EOF
[project]
name = "aimers-${service}"
version = "0.1.0"
description = "AIMERS OS ${service} service"
requires-python = ">=3.11"
EOF

  cat > "${base}/src/main.py" <<EOF
"""AIMERS OS ${service} service."""
EOF

  touch \
    "${base}/README.md" \
    "${base}/requirements.txt" \
    "${base}/Dockerfile" \
    "${base}/.env.example" \
    "${base}/src/__init__.py" \
    "${base}/src/api/__init__.py" \
    "${base}/src/api/routes.py" \
    "${base}/src/config/__init__.py" \
    "${base}/src/config/settings.py" \
    "${base}/src/core/__init__.py" \
    "${base}/src/models/__init__.py" \
    "${base}/src/pipelines/__init__.py" \
    "${base}/src/prompts/__init__.py" \
    "${base}/src/repositories/__init__.py" \
    "${base}/src/services/__init__.py" \
    "${base}/src/types/__init__.py" \
    "${base}/src/utils/__init__.py"
}

# ============================================================
# ROOT
# ============================================================

make_dirs \
  apps \
  services \
  packages \
  database \
  infrastructure \
  docs \
  scripts \
  monitoring \
  security \
  storage \
  tests \
  tooling

cat > package.json <<'EOF'
{
  "name": "aimers-os-v2",
  "version": "2.0.0",
  "private": true,
  "description": "AIMERS OS subscription-based AI learning operating system",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "test": "turbo test",
    "format": "prettier --write .",
    "clean": "turbo clean"
  },
  "engines": {
    "node": ">=22"
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        "build/**",
        ".next/**"
      ]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@aimers/ui": ["packages/ui/src"],
      "@aimers/types": ["packages/types/src"],
      "@aimers/config": ["packages/config/src"],
      "@aimers/design-tokens": [
        "packages/design-tokens/src"
      ]
    }
  }
}
EOF

cat > eslint.config.js <<'EOF'
export default [];
EOF

cat > prettier.config.js <<'EOF'
export default {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 80
};
EOF

cat > .editorconfig <<'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
EOF

cat > .gitignore <<'EOF'
# Dependencies
node_modules
.pnpm-store

# Builds
dist
build
out
.next
.turbo
.vite
coverage

# Environment files
.env
.env.*
!.env.example

# Logs
*.log
logs

# macOS
.DS_Store

# Editors
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json

# Python
__pycache__
*.pyc
.venv
venv

# Databases
*.db
*.sqlite
*.sqlite3

# Test output
playwright-report
test-results

# Local storage
storage/private/*
storage/temp/*
storage/uploads/*
storage/exports/*
storage/imports/*

# Secrets and certificates
*.pem
*.key
*.crt
*.p12
*.pfx

# Local authentication
aimers-cookies.txt
EOF

cat > .env.example <<'EOF'
NODE_ENV=development

WEB_URL=http://localhost:5173
MARKETING_URL=http://localhost:5174
ADMIN_URL=http://localhost:5175
STAFF_URL=http://localhost:5176
API_URL=http://localhost:4000

DATABASE_URL=
REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

AI_PROVIDER=mock
OPENAI_API_KEY=

PAYMENT_PROVIDER=mock
PAYMENT_WEBHOOK_SECRET=
EOF

cat > docker-compose.yml <<'EOF'
services: {}
EOF

cat > README.md <<'EOF'
# AIMERS OS V2

AIMERS OS is a subscription-based AI learning operating system.

## Applications

- Public marketing website
- Student learning application
- CEO and company administration dashboard
- Mentor and staff application
- Parent portal
- Institution portal
- Mobile application
- Browser extension
- Desktop activity agent
- API
- Background worker
- Realtime gateway

## Core student pages

- Dashboard
- AI Mentor
- Behavior AI
- Digital Activity
- Planner
- Subjects
- Analytics
- Prediction
- Memory Engine
- Question Bank
- Mock Tests
- Flashcards
- Notes
- Research AI
- Community
- Achievements
- Settings
EOF

touch \
  CONTRIBUTING.md \
  SECURITY.md \
  CHANGELOG.md \
  .npmrc

printf 'lts/*\n' > .nvmrc

# ============================================================
# MARKETING WEBSITE
# ============================================================

create_frontend_app \
  "marketing" \
  "AIMERS OS Public Website"

MARKETING_PAGES=(
  home
  features
  how-it-works
  students
  parents
  institutions
  coaching-centres
  pricing
  compare-plans
  about
  security
  privacy
  terms
  contact
  blog
  careers
  login
  register
  checkout
  payment-success
  help
  status
)

for page in "${MARKETING_PAGES[@]}"; do
  create_frontend_page "marketing" "$page"
done

make_dirs \
  apps/marketing/src/components/announcement \
  apps/marketing/src/components/blog \
  apps/marketing/src/components/comparison \
  apps/marketing/src/components/cta \
  apps/marketing/src/components/faq \
  apps/marketing/src/components/features \
  apps/marketing/src/components/footer \
  apps/marketing/src/components/header \
  apps/marketing/src/components/hero \
  apps/marketing/src/components/legal \
  apps/marketing/src/components/logos \
  apps/marketing/src/components/media \
  apps/marketing/src/components/pricing \
  apps/marketing/src/components/security \
  apps/marketing/src/components/seo \
  apps/marketing/src/components/social-proof \
  apps/marketing/src/components/testimonials

# ============================================================
# STUDENT SUBSCRIPTION WEB APPLICATION
# ============================================================

create_frontend_app \
  "web" \
  "AIMERS OS Student Application"

STUDENT_PAGES=(
  login
  register
  forgot-password
  reset-password
  onboarding
  dashboard
  ai-mentor
  behavior-ai
  digital-activity
  planner
  subjects
  analytics
  prediction
  memory-engine
  question-bank
  mock-tests
  flashcards
  notes
  research-ai
  community
  achievements
  focus-room
  notifications
  calendar
  profile
  subscription
  billing
  checkout
  settings
  help-support
  not-found
)

for page in "${STUDENT_PAGES[@]}"; do
  create_frontend_page "web" "$page"
done

make_dirs \
  apps/web/src/features/achievements \
  apps/web/src/features/activity \
  apps/web/src/features/ai-mentor \
  apps/web/src/features/analytics \
  apps/web/src/features/auth \
  apps/web/src/features/behavior \
  apps/web/src/features/billing \
  apps/web/src/features/calendar \
  apps/web/src/features/community \
  apps/web/src/features/dashboard \
  apps/web/src/features/flashcards \
  apps/web/src/features/focus \
  apps/web/src/features/help \
  apps/web/src/features/memory \
  apps/web/src/features/notes \
  apps/web/src/features/notifications \
  apps/web/src/features/onboarding \
  apps/web/src/features/planner \
  apps/web/src/features/prediction \
  apps/web/src/features/profile \
  apps/web/src/features/question-bank \
  apps/web/src/features/research \
  apps/web/src/features/settings \
  apps/web/src/features/subjects \
  apps/web/src/features/subscriptions \
  apps/web/src/features/tests \
  apps/web/src/features/voice

make_dirs \
  apps/web/src/pages/dashboard/header \
  apps/web/src/pages/dashboard/metrics \
  apps/web/src/pages/dashboard/sections \
  apps/web/src/pages/dashboard/widgets \
  apps/web/src/pages/dashboard/quick-actions \
  apps/web/src/pages/dashboard/aimers-brain \
  apps/web/src/pages/dashboard/todays-mission \
  apps/web/src/pages/dashboard/ai-insights \
  apps/web/src/pages/dashboard/activity-monitor \
  apps/web/src/pages/dashboard/study-analytics \
  apps/web/src/pages/dashboard/subject-progress \
  apps/web/src/pages/dashboard/weak-topics \
  apps/web/src/pages/dashboard/predicted-performance \
  apps/web/src/pages/dashboard/memory-retention \
  apps/web/src/pages/dashboard/voice-assistant

make_dirs \
  apps/web/src/pages/ai-mentor/chat \
  apps/web/src/pages/ai-mentor/conversations \
  apps/web/src/pages/ai-mentor/prompts \
  apps/web/src/pages/ai-mentor/voice \
  apps/web/src/pages/behavior-ai/overview \
  apps/web/src/pages/behavior-ai/patterns \
  apps/web/src/pages/behavior-ai/insights \
  apps/web/src/pages/behavior-ai/interventions \
  apps/web/src/pages/behavior-ai/reports \
  apps/web/src/pages/digital-activity/overview \
  apps/web/src/pages/digital-activity/apps \
  apps/web/src/pages/digital-activity/browsers \
  apps/web/src/pages/digital-activity/social-media \
  apps/web/src/pages/digital-activity/content \
  apps/web/src/pages/digital-activity/history \
  apps/web/src/pages/digital-activity/devices \
  apps/web/src/pages/digital-activity/privacy \
  apps/web/src/pages/digital-activity/reports \
  apps/web/src/pages/planner/day \
  apps/web/src/pages/planner/week \
  apps/web/src/pages/planner/month \
  apps/web/src/pages/planner/calendar \
  apps/web/src/pages/planner/tasks \
  apps/web/src/pages/subjects/syllabus \
  apps/web/src/pages/subjects/chapters \
  apps/web/src/pages/subjects/topics \
  apps/web/src/pages/subjects/resources \
  apps/web/src/pages/subjects/progress \
  apps/web/src/pages/analytics/study \
  apps/web/src/pages/analytics/performance \
  apps/web/src/pages/analytics/trends \
  apps/web/src/pages/analytics/reports \
  apps/web/src/pages/prediction/score \
  apps/web/src/pages/prediction/rank \
  apps/web/src/pages/prediction/risk \
  apps/web/src/pages/prediction/scenarios \
  apps/web/src/pages/memory-engine/overview \
  apps/web/src/pages/memory-engine/retention \
  apps/web/src/pages/memory-engine/forgetting-curve \
  apps/web/src/pages/memory-engine/reviews \
  apps/web/src/pages/memory-engine/sessions \
  apps/web/src/pages/question-bank/browse \
  apps/web/src/pages/question-bank/practice \
  apps/web/src/pages/question-bank/bookmarks \
  apps/web/src/pages/question-bank/solutions \
  apps/web/src/pages/question-bank/filters \
  apps/web/src/pages/mock-tests/library \
  apps/web/src/pages/mock-tests/attempt \
  apps/web/src/pages/mock-tests/results \
  apps/web/src/pages/mock-tests/review \
  apps/web/src/pages/mock-tests/history \
  apps/web/src/pages/flashcards/decks \
  apps/web/src/pages/flashcards/create \
  apps/web/src/pages/flashcards/review \
  apps/web/src/pages/flashcards/library \
  apps/web/src/pages/notes/library \
  apps/web/src/pages/notes/editor \
  apps/web/src/pages/notes/folders \
  apps/web/src/pages/notes/voice-notes \
  apps/web/src/pages/notes/links \
  apps/web/src/pages/research-ai/projects \
  apps/web/src/pages/research-ai/assistant \
  apps/web/src/pages/research-ai/sources \
  apps/web/src/pages/research-ai/mind-map \
  apps/web/src/pages/research-ai/library \
  apps/web/src/pages/community/feed \
  apps/web/src/pages/community/discussions \
  apps/web/src/pages/community/study-groups \
  apps/web/src/pages/community/challenges \
  apps/web/src/pages/community/leaderboard \
  apps/web/src/pages/achievements/badges \
  apps/web/src/pages/achievements/streaks \
  apps/web/src/pages/achievements/levels \
  apps/web/src/pages/achievements/milestones \
  apps/web/src/pages/achievements/rewards \
  apps/web/src/pages/focus-room/session \
  apps/web/src/pages/focus-room/pomodoro \
  apps/web/src/pages/focus-room/music \
  apps/web/src/pages/focus-room/history \
  apps/web/src/pages/settings/account \
  apps/web/src/pages/settings/learning \
  apps/web/src/pages/settings/ai \
  apps/web/src/pages/settings/notifications \
  apps/web/src/pages/settings/privacy \
  apps/web/src/pages/settings/security \
  apps/web/src/pages/settings/devices \
  apps/web/src/pages/settings/billing \
  apps/web/src/pages/billing/plans \
  apps/web/src/pages/billing/subscription \
  apps/web/src/pages/billing/payments \
  apps/web/src/pages/billing/invoices \
  apps/web/src/pages/billing/coupons \
  apps/web/src/pages/billing/usage

make_dirs \
  apps/web/src/components/activity \
  apps/web/src/components/ai \
  apps/web/src/components/behavior \
  apps/web/src/components/billing \
  apps/web/src/components/community \
  apps/web/src/components/dashboard \
  apps/web/src/components/flashcards \
  apps/web/src/components/memory \
  apps/web/src/components/mentor \
  apps/web/src/components/notes \
  apps/web/src/components/notifications \
  apps/web/src/components/planner \
  apps/web/src/components/prediction \
  apps/web/src/components/question-bank \
  apps/web/src/components/research \
  apps/web/src/components/settings \
  apps/web/src/components/subjects \
  apps/web/src/components/tests \
  apps/web/src/components/voice

# ============================================================
# CEO / COMPANY ADMIN APPLICATION
# ============================================================

create_frontend_app \
  "admin" \
  "AIMERS OS Company Administration"

ADMIN_PAGES=(
  login
  overview
  revenue
  subscriptions
  customers
  students
  student-profile
  cohorts
  rankers
  mentors
  staff
  learning-analytics
  product-analytics
  behavior-analytics
  digital-activity
  ai-operations
  predictions
  experiments
  interventions
  content-management
  question-bank
  mock-tests
  community
  support
  notifications
  privacy
  consents
  audit-logs
  data-requests
  security
  system-health
  feature-flags
  settings
)

for page in "${ADMIN_PAGES[@]}"; do
  create_frontend_page "admin" "$page"
done

make_dirs \
  apps/admin/src/pages/overview/growth \
  apps/admin/src/pages/overview/operations \
  apps/admin/src/pages/overview/outcomes \
  apps/admin/src/pages/overview/realtime \
  apps/admin/src/pages/overview/revenue \
  apps/admin/src/pages/revenue/arr \
  apps/admin/src/pages/revenue/mrr \
  apps/admin/src/pages/revenue/churn \
  apps/admin/src/pages/revenue/conversion \
  apps/admin/src/pages/revenue/refunds \
  apps/admin/src/pages/subscriptions/plans \
  apps/admin/src/pages/subscriptions/trials \
  apps/admin/src/pages/subscriptions/invoices \
  apps/admin/src/pages/subscriptions/coupons \
  apps/admin/src/pages/subscriptions/failed-payments \
  apps/admin/src/pages/students/directory \
  apps/admin/src/pages/students/engagement \
  apps/admin/src/pages/students/outcomes \
  apps/admin/src/pages/students/risks \
  apps/admin/src/pages/student-profile/learning \
  apps/admin/src/pages/student-profile/activity \
  apps/admin/src/pages/student-profile/behavior \
  apps/admin/src/pages/student-profile/tests \
  apps/admin/src/pages/student-profile/memory \
  apps/admin/src/pages/student-profile/interventions \
  apps/admin/src/pages/student-profile/mentor \
  apps/admin/src/pages/student-profile/consent \
  apps/admin/src/pages/cohorts/create \
  apps/admin/src/pages/cohorts/comparison \
  apps/admin/src/pages/cohorts/retention \
  apps/admin/src/pages/cohorts/segments \
  apps/admin/src/pages/rankers/analysis \
  apps/admin/src/pages/rankers/behavior \
  apps/admin/src/pages/rankers/journeys \
  apps/admin/src/pages/rankers/patterns \
  apps/admin/src/pages/learning-analytics/subjects \
  apps/admin/src/pages/learning-analytics/lectures \
  apps/admin/src/pages/learning-analytics/tests \
  apps/admin/src/pages/learning-analytics/memory \
  apps/admin/src/pages/learning-analytics/weak-topics \
  apps/admin/src/pages/product-analytics/adoption \
  apps/admin/src/pages/product-analytics/funnels \
  apps/admin/src/pages/product-analytics/pages \
  apps/admin/src/pages/product-analytics/retention \
  apps/admin/src/pages/product-analytics/sessions \
  apps/admin/src/pages/behavior-analytics/distractions \
  apps/admin/src/pages/behavior-analytics/focus \
  apps/admin/src/pages/behavior-analytics/social-media \
  apps/admin/src/pages/behavior-analytics/trends \
  apps/admin/src/pages/ai-operations/models \
  apps/admin/src/pages/ai-operations/prompts \
  apps/admin/src/pages/ai-operations/usage \
  apps/admin/src/pages/ai-operations/costs \
  apps/admin/src/pages/ai-operations/evaluations \
  apps/admin/src/pages/ai-operations/quality \
  apps/admin/src/pages/ai-operations/safety \
  apps/admin/src/pages/experiments/create \
  apps/admin/src/pages/experiments/cohorts \
  apps/admin/src/pages/experiments/results \
  apps/admin/src/pages/experiments/rollouts \
  apps/admin/src/pages/interventions/library \
  apps/admin/src/pages/interventions/rules \
  apps/admin/src/pages/interventions/assignments \
  apps/admin/src/pages/interventions/outcomes \
  apps/admin/src/pages/privacy/age-verification \
  apps/admin/src/pages/privacy/consent \
  apps/admin/src/pages/privacy/exports \
  apps/admin/src/pages/privacy/deletion \
  apps/admin/src/pages/privacy/retention \
  apps/admin/src/pages/security/access-control \
  apps/admin/src/pages/security/incidents \
  apps/admin/src/pages/security/sessions \
  apps/admin/src/pages/system-health/apis \
  apps/admin/src/pages/system-health/databases \
  apps/admin/src/pages/system-health/jobs \
  apps/admin/src/pages/system-health/queues \
  apps/admin/src/pages/system-health/realtime \
  apps/admin/src/pages/system-health/storage

make_dirs \
  apps/admin/src/components/access \
  apps/admin/src/components/audit \
  apps/admin/src/components/billing \
  apps/admin/src/components/cohorts \
  apps/admin/src/components/experiments \
  apps/admin/src/components/filters \
  apps/admin/src/components/interventions \
  apps/admin/src/components/privacy \
  apps/admin/src/components/reports \
  apps/admin/src/components/students \
  apps/admin/src/components/system

# ============================================================
# MENTOR / STAFF APPLICATION
# ============================================================

create_frontend_app \
  "staff" \
  "AIMERS OS Mentor and Staff Portal"

STAFF_PAGES=(
  login
  dashboard
  assigned-students
  student-profile
  daily-alerts
  missed-lectures
  backlogs
  weak-topics
  test-performance
  study-behavior
  interventions
  mentor-notes
  communication
  escalations
  calendar
  reports
  settings
)

for page in "${STAFF_PAGES[@]}"; do
  create_frontend_page "staff" "$page"
done

make_dirs \
  apps/staff/src/components/alerts \
  apps/staff/src/components/communication \
  apps/staff/src/components/interventions \
  apps/staff/src/components/mentor-notes \
  apps/staff/src/components/student-profile \
  apps/staff/src/components/student-table

# ============================================================
# PARENT PORTAL
# ============================================================

create_frontend_app \
  "parent" \
  "AIMERS OS Parent Portal"

PARENT_PAGES=(
  login
  dashboard
  child-progress
  attendance
  study-time
  test-results
  weak-topics
  alerts
  reports
  subscriptions
  privacy
  settings
)

for page in "${PARENT_PAGES[@]}"; do
  create_frontend_page "parent" "$page"
done

# ============================================================
# INSTITUTION PORTAL
# ============================================================

create_frontend_app \
  "institution" \
  "AIMERS OS Institution Portal"

INSTITUTION_PAGES=(
  login
  dashboard
  students
  batches
  teachers
  attendance
  performance
  tests
  content
  analytics
  reports
  licences
  billing
  settings
)

for page in "${INSTITUTION_PAGES[@]}"; do
  create_frontend_page "institution" "$page"
done

# ============================================================
# MOBILE APPLICATION
# ============================================================

make_dirs \
  apps/mobile/src/app \
  apps/mobile/src/assets \
  apps/mobile/src/components \
  apps/mobile/src/config \
  apps/mobile/src/features \
  apps/mobile/src/hooks \
  apps/mobile/src/navigation \
  apps/mobile/src/screens/auth \
  apps/mobile/src/screens/dashboard \
  apps/mobile/src/screens/mentor \
  apps/mobile/src/screens/behavior \
  apps/mobile/src/screens/activity \
  apps/mobile/src/screens/planner \
  apps/mobile/src/screens/focus \
  apps/mobile/src/screens/subjects \
  apps/mobile/src/screens/analytics \
  apps/mobile/src/screens/memory \
  apps/mobile/src/screens/tests \
  apps/mobile/src/screens/flashcards \
  apps/mobile/src/screens/notifications \
  apps/mobile/src/screens/profile \
  apps/mobile/src/screens/settings \
  apps/mobile/src/services \
  apps/mobile/src/state \
  apps/mobile/src/styles \
  apps/mobile/src/types \
  apps/mobile/src/utils

cat > apps/mobile/package.json <<'EOF'
{
  "name": "@aimers/mobile",
  "version": "0.0.0",
  "private": true
}
EOF

make_ts_file apps/mobile/src/app/App.tsx
make_ts_file apps/mobile/src/navigation/index.tsx
make_ts_file apps/mobile/src/services/api.ts
make_ts_file apps/mobile/src/styles/theme.ts
make_ts_file apps/mobile/src/types/index.ts

touch \
  apps/mobile/app.json \
  apps/mobile/tsconfig.json \
  apps/mobile/.env.example

# ============================================================
# BROWSER EXTENSION
# ============================================================

make_dirs \
  apps/browser-extension/public/icons \
  apps/browser-extension/public/images \
  apps/browser-extension/src/background \
  apps/browser-extension/src/content \
  apps/browser-extension/src/classifiers \
  apps/browser-extension/src/detectors/generic \
  apps/browser-extension/src/detectors/youtube \
  apps/browser-extension/src/detectors/pw \
  apps/browser-extension/src/detectors/unacademy \
  apps/browser-extension/src/detectors/moodle \
  apps/browser-extension/src/detectors/google-classroom \
  apps/browser-extension/src/detectors/learning-platforms \
  apps/browser-extension/src/detectors/social-media \
  apps/browser-extension/src/history \
  apps/browser-extension/src/lib \
  apps/browser-extension/src/messaging \
  apps/browser-extension/src/options \
  apps/browser-extension/src/permissions \
  apps/browser-extension/src/popup \
  apps/browser-extension/src/privacy \
  apps/browser-extension/src/services \
  apps/browser-extension/src/state \
  apps/browser-extension/src/styles \
  apps/browser-extension/src/sync \
  apps/browser-extension/src/types \
  apps/browser-extension/src/utils

cat > apps/browser-extension/package.json <<'EOF'
{
  "name": "@aimers/browser-extension",
  "version": "0.0.0",
  "private": true,
  "type": "module"
}
EOF

touch \
  apps/browser-extension/manifest.json \
  apps/browser-extension/tsconfig.json \
  apps/browser-extension/vite.config.ts \
  apps/browser-extension/.env.example

make_ts_file apps/browser-extension/src/background/index.ts
make_ts_file apps/browser-extension/src/content/index.ts
make_ts_file apps/browser-extension/src/popup/index.tsx
make_ts_file apps/browser-extension/src/options/index.tsx
make_ts_file apps/browser-extension/src/services/activity-api.ts
make_ts_file apps/browser-extension/src/privacy/exclusions.ts
make_ts_file apps/browser-extension/src/types/index.ts

# ============================================================
# DESKTOP ACTIVITY AGENT
# ============================================================

make_dirs \
  apps/desktop-agent/src/agents/macos \
  apps/desktop-agent/src/agents/windows \
  apps/desktop-agent/src/agents/linux \
  apps/desktop-agent/src/app \
  apps/desktop-agent/src/collectors/active-app \
  apps/desktop-agent/src/collectors/window-title \
  apps/desktop-agent/src/collectors/idleness \
  apps/desktop-agent/src/collectors/browser \
  apps/desktop-agent/src/collectors/media \
  apps/desktop-agent/src/collectors/system \
  apps/desktop-agent/src/classifiers \
  apps/desktop-agent/src/config \
  apps/desktop-agent/src/database \
  apps/desktop-agent/src/ipc \
  apps/desktop-agent/src/permissions \
  apps/desktop-agent/src/privacy \
  apps/desktop-agent/src/services \
  apps/desktop-agent/src/sync \
  apps/desktop-agent/src/telemetry \
  apps/desktop-agent/src/types \
  apps/desktop-agent/src/ui/components \
  apps/desktop-agent/src/ui/pages/dashboard \
  apps/desktop-agent/src/ui/pages/devices \
  apps/desktop-agent/src/ui/pages/monitoring \
  apps/desktop-agent/src/ui/pages/permissions \
  apps/desktop-agent/src/ui/pages/privacy \
  apps/desktop-agent/src/ui/pages/settings \
  apps/desktop-agent/src/ui/pages/status \
  apps/desktop-agent/src/ui/styles \
  apps/desktop-agent/src/utils

cat > apps/desktop-agent/package.json <<'EOF'
{
  "name": "@aimers/desktop-agent",
  "version": "0.0.0",
  "private": true,
  "type": "module"
}
EOF

touch \
  apps/desktop-agent/tsconfig.json \
  apps/desktop-agent/electron-builder.yml \
  apps/desktop-agent/.env.example

make_ts_file apps/desktop-agent/src/app/main.ts
make_ts_file apps/desktop-agent/src/app/preload.ts
make_ts_file apps/desktop-agent/src/app/renderer.tsx
make_ts_file apps/desktop-agent/src/services/activity-sync.ts
make_ts_file apps/desktop-agent/src/privacy/exclusions.ts
make_ts_file apps/desktop-agent/src/types/index.ts

# ============================================================
# API APPLICATION
# ============================================================

make_dirs \
  apps/api/src/app \
  apps/api/src/config \
  apps/api/src/controllers \
  apps/api/src/decorators \
  apps/api/src/errors \
  apps/api/src/guards \
  apps/api/src/interceptors \
  apps/api/src/middleware \
  apps/api/src/modules \
  apps/api/src/policies \
  apps/api/src/routes \
  apps/api/src/services \
  apps/api/src/types \
  apps/api/src/utils \
  apps/api/src/validators

cat > apps/api/package.json <<'EOF'
{
  "name": "@aimers/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  }
}
EOF

cat > apps/api/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["src"]
}
EOF

make_ts_file apps/api/src/main.ts
make_ts_file apps/api/src/app/app.ts
make_ts_file apps/api/src/config/env.ts
make_ts_file apps/api/src/config/database.ts
make_ts_file apps/api/src/config/redis.ts
make_ts_file apps/api/src/routes/index.ts
make_ts_file apps/api/src/middleware/error-handler.ts
make_ts_file apps/api/src/middleware/request-id.ts
make_ts_file apps/api/src/middleware/rate-limit.ts
make_ts_file apps/api/src/middleware/authenticate.ts
make_ts_file apps/api/src/middleware/authorize.ts
make_ts_file apps/api/src/types/express.d.ts
touch apps/api/.env.example

API_MODULES=(
  health
  auth
  users
  accounts
  sessions
  roles
  permissions
  organisations
  onboarding
  profiles
  students
  parents
  staff
  admin
  institutions
  subjects
  syllabus
  content
  planner
  calendar
  focus
  activity
  devices
  consent
  behavior
  analytics
  predictions
  ai
  mentor
  memory
  question-bank
  tests
  flashcards
  notes
  research
  achievements
  community
  notifications
  search
  voice
  subscriptions
  billing
  entitlements
  usage
  coupons
  invoices
  payments
  refunds
  experiments
  interventions
  cohorts
  feature-flags
  audit
  privacy
  data-requests
  security-events
  support
  uploads
  webhooks
)

for module in "${API_MODULES[@]}"; do
  create_api_module "$module"
done

# ============================================================
# BACKGROUND WORKER
# ============================================================

make_dirs \
  apps/worker/src/config \
  apps/worker/src/consumers \
  apps/worker/src/cron \
  apps/worker/src/jobs/activity-aggregation \
  apps/worker/src/jobs/behavior-snapshots \
  apps/worker/src/jobs/ai-reports \
  apps/worker/src/jobs/analytics \
  apps/worker/src/jobs/billing \
  apps/worker/src/jobs/consent-expiry \
  apps/worker/src/jobs/data-retention \
  apps/worker/src/jobs/emails \
  apps/worker/src/jobs/experiments \
  apps/worker/src/jobs/interventions \
  apps/worker/src/jobs/notifications \
  apps/worker/src/jobs/predictions \
  apps/worker/src/jobs/reports \
  apps/worker/src/jobs/subscriptions \
  apps/worker/src/processors \
  apps/worker/src/queues \
  apps/worker/src/schedulers \
  apps/worker/src/services \
  apps/worker/src/types \
  apps/worker/src/utils

cat > apps/worker/package.json <<'EOF'
{
  "name": "@aimers/worker",
  "version": "0.0.0",
  "private": true,
  "type": "module"
}
EOF

touch \
  apps/worker/tsconfig.json \
  apps/worker/.env.example

make_ts_file apps/worker/src/main.ts
make_ts_file apps/worker/src/config/env.ts
make_ts_file apps/worker/src/queues/index.ts

# ============================================================
# REALTIME GATEWAY
# ============================================================

make_dirs \
  apps/realtime/src/auth \
  apps/realtime/src/channels \
  apps/realtime/src/config \
  apps/realtime/src/events \
  apps/realtime/src/handlers \
  apps/realtime/src/presence \
  apps/realtime/src/rooms \
  apps/realtime/src/services \
  apps/realtime/src/types

cat > apps/realtime/package.json <<'EOF'
{
  "name": "@aimers/realtime",
  "version": "0.0.0",
  "private": true,
  "type": "module"
}
EOF

touch \
  apps/realtime/tsconfig.json \
  apps/realtime/.env.example

make_ts_file apps/realtime/src/main.ts
make_ts_file apps/realtime/src/config/env.ts
make_ts_file apps/realtime/src/events/index.ts

# ============================================================
# AI AND DATA SERVICES
# ============================================================

AI_SERVICES=(
  ai-orchestrator
  ai-mentor
  ai-behavior
  ai-memory
  ai-prediction
  ai-research
  ai-voice
  ai-content
  analytics-engine
  recommendation-engine
  search-engine
  content-classifier
)

for service in "${AI_SERVICES[@]}"; do
  create_python_service "$service"
done

# ============================================================
# SHARED PACKAGES
# ============================================================

SHARED_PACKAGES=(
  ui
  design-tokens
  types
  config
  auth
  database
  billing
  permissions
  analytics
  ai
  events
  feature-flags
  logger
  notifications
  security
  validation
  testing
  utils
  errors
)

for package in "${SHARED_PACKAGES[@]}"; do
  create_shared_package "$package"
done

make_dirs \
  packages/ui/src/components/accordion \
  packages/ui/src/components/avatar \
  packages/ui/src/components/badge \
  packages/ui/src/components/breadcrumb \
  packages/ui/src/components/button \
  packages/ui/src/components/calendar \
  packages/ui/src/components/card \
  packages/ui/src/components/chart \
  packages/ui/src/components/checkbox \
  packages/ui/src/components/command \
  packages/ui/src/components/dialog \
  packages/ui/src/components/drawer \
  packages/ui/src/components/dropdown \
  packages/ui/src/components/empty-state \
  packages/ui/src/components/error-state \
  packages/ui/src/components/form \
  packages/ui/src/components/input \
  packages/ui/src/components/loading \
  packages/ui/src/components/menu \
  packages/ui/src/components/modal \
  packages/ui/src/components/navigation \
  packages/ui/src/components/pagination \
  packages/ui/src/components/popover \
  packages/ui/src/components/progress \
  packages/ui/src/components/select \
  packages/ui/src/components/skeleton \
  packages/ui/src/components/slider \
  packages/ui/src/components/switch \
  packages/ui/src/components/table \
  packages/ui/src/components/tabs \
  packages/ui/src/components/toast \
  packages/ui/src/components/tooltip \
  packages/ui/src/hooks \
  packages/ui/src/icons \
  packages/ui/src/layouts \
  packages/ui/src/primitives \
  packages/ui/src/styles \
  packages/ui/src/types \
  packages/ui/src/utils

make_dirs \
  packages/design-tokens/src/animations \
  packages/design-tokens/src/borders \
  packages/design-tokens/src/breakpoints \
  packages/design-tokens/src/colors \
  packages/design-tokens/src/effects \
  packages/design-tokens/src/gradients \
  packages/design-tokens/src/radius \
  packages/design-tokens/src/shadows \
  packages/design-tokens/src/spacing \
  packages/design-tokens/src/typography \
  packages/design-tokens/src/z-index

cat > packages/design-tokens/src/tokens.css <<'EOF'
:root {
  --aimers-background: #050714;
  --aimers-background-secondary: #080b18;
  --aimers-surface: #0b1020;
  --aimers-surface-elevated: #10162a;

  --aimers-primary: #7c3aed;
  --aimers-primary-bright: #9d4edd;
  --aimers-secondary: #06b6d4;
  --aimers-accent: #ec4899;

  --aimers-success: #22c55e;
  --aimers-information: #3b82f6;
  --aimers-warning: #f59e0b;
  --aimers-danger: #ef4444;

  --aimers-text-primary: #f8f9ff;
  --aimers-text-secondary: #a4acc4;
  --aimers-text-muted: #68708a;

  --aimers-border: rgba(152, 162, 255, 0.16);
  --aimers-glass: rgba(12, 18, 37, 0.78);

  --aimers-gradient-primary:
    linear-gradient(
      135deg,
      #6d28d9,
      #9333ea,
      #db2777
    );

  --aimers-gradient-blue:
    linear-gradient(
      135deg,
      #2563eb,
      #06b6d4
    );

  --aimers-gradient-success:
    linear-gradient(
      135deg,
      #16a34a,
      #22c55e,
      #14b8a6
    );

  --aimers-radius-small: 10px;
  --aimers-radius-medium: 16px;
  --aimers-radius-large: 24px;

  --aimers-shadow-neon:
    0 0 30px rgba(124, 58, 237, 0.25);
}
EOF

make_ts_file packages/design-tokens/src/colors/index.ts
make_ts_file packages/design-tokens/src/gradients/index.ts
make_ts_file packages/design-tokens/src/typography/index.ts
make_ts_file packages/design-tokens/src/spacing/index.ts
make_ts_file packages/design-tokens/src/shadows/index.ts
make_ts_file packages/design-tokens/src/animations/index.ts

make_dirs \
  packages/database/src/client \
  packages/database/src/migrations \
  packages/database/src/repositories \
  packages/database/src/seeds \
  packages/database/src/types \
  packages/auth/src/cookies \
  packages/auth/src/jwt \
  packages/auth/src/oauth \
  packages/auth/src/passwords \
  packages/auth/src/sessions \
  packages/billing/src/entitlements \
  packages/billing/src/plans \
  packages/billing/src/providers \
  packages/billing/src/usage \
  packages/billing/src/webhooks \
  packages/permissions/src/abilities \
  packages/permissions/src/policies \
  packages/permissions/src/roles \
  packages/permissions/src/rules \
  packages/analytics/src/events \
  packages/analytics/src/metrics \
  packages/analytics/src/tracking \
  packages/analytics/src/types \
  packages/ai/src/clients \
  packages/ai/src/models \
  packages/ai/src/prompts \
  packages/ai/src/providers \
  packages/ai/src/safety \
  packages/ai/src/types \
  packages/security/src/audit \
  packages/security/src/encryption \
  packages/security/src/hashing \
  packages/security/src/redaction \
  packages/security/src/secrets

# ============================================================
# DATABASE
# ============================================================

make_dirs \
  database/backups \
  database/docs \
  database/migrations \
  database/prisma \
  database/prisma/models \
  database/seeds \
  database/snapshots

cat > database/prisma/schema.prisma <<'EOF'
// AIMERS OS V2 database schema.
// Domain models will be added during implementation.
EOF

touch \
  database/prisma/seed.ts \
  database/docs/ERD.md \
  database/docs/DATA_DICTIONARY.md \
  database/docs/RETENTION_POLICY.md

DATABASE_MODELS=(
  user
  account
  session
  role
  permission
  organisation
  organisation-member
  student-profile
  parent-profile
  mentor-profile
  staff-profile
  institution
  subscription-plan
  subscription
  entitlement
  usage-limit
  payment-customer
  payment-transaction
  invoice
  coupon
  refund
  billing-event
  webhook-event
  subject
  syllabus
  chapter
  topic
  lecture
  lecture-progress
  study-task
  study-session
  focus-session
  flashcard
  flashcard-review
  memory-snapshot
  question
  question-attempt
  mock-test
  test-attempt
  weak-topic
  prediction
  research-project
  research-note
  research-source
  mentor-conversation
  mentor-message
  note
  note-folder
  achievement
  student-achievement
  community-post
  community-comment
  study-group
  notification
  device
  consent-grant
  activity-event
  activity-session
  activity-content
  daily-behavior-snapshot
  behavior-insight
  intervention
  intervention-assignment
  intervention-outcome
  experiment
  experiment-cohort
  feature-flag
  staff-student-assignment
  staff-access-audit
  data-export-request
  data-deletion-request
  security-event
  support-ticket
)

for model in "${DATABASE_MODELS[@]}"; do
  cat > "database/prisma/models/${model}.prisma" <<EOF
// ${model} model placeholder.
EOF
done

# ============================================================
# INFRASTRUCTURE
# ============================================================

make_dirs \
  infrastructure/aws/cloudfront \
  infrastructure/aws/ecs \
  infrastructure/aws/iam \
  infrastructure/aws/lambda \
  infrastructure/aws/rds \
  infrastructure/aws/route53 \
  infrastructure/aws/s3 \
  infrastructure/aws/secrets \
  infrastructure/aws/ses \
  infrastructure/aws/sns \
  infrastructure/aws/sqs \
  infrastructure/aws/vpc \
  infrastructure/cloudflare \
  infrastructure/docker \
  infrastructure/github/workflows \
  infrastructure/kubernetes/base \
  infrastructure/kubernetes/development \
  infrastructure/kubernetes/staging \
  infrastructure/kubernetes/production \
  infrastructure/nginx \
  infrastructure/terraform/environments/development \
  infrastructure/terraform/environments/staging \
  infrastructure/terraform/environments/production \
  infrastructure/terraform/modules/cdn \
  infrastructure/terraform/modules/database \
  infrastructure/terraform/modules/dns \
  infrastructure/terraform/modules/iam \
  infrastructure/terraform/modules/networking \
  infrastructure/terraform/modules/queues \
  infrastructure/terraform/modules/secrets \
  infrastructure/terraform/modules/services \
  infrastructure/terraform/modules/storage

touch \
  infrastructure/docker/api.Dockerfile \
  infrastructure/docker/web.Dockerfile \
  infrastructure/docker/admin.Dockerfile \
  infrastructure/docker/worker.Dockerfile \
  infrastructure/nginx/nginx.conf \
  infrastructure/github/workflows/ci.yml \
  infrastructure/github/workflows/deploy-development.yml \
  infrastructure/github/workflows/deploy-staging.yml \
  infrastructure/github/workflows/deploy-production.yml \
  infrastructure/terraform/environments/development/main.tf \
  infrastructure/terraform/environments/staging/main.tf \
  infrastructure/terraform/environments/production/main.tf

# ============================================================
# MONITORING
# ============================================================

make_dirs \
  monitoring/alerts \
  monitoring/dashboards/api \
  monitoring/dashboards/billing \
  monitoring/dashboards/business \
  monitoring/dashboards/database \
  monitoring/dashboards/learning \
  monitoring/dashboards/queues \
  monitoring/dashboards/realtime \
  monitoring/dashboards/security \
  monitoring/grafana \
  monitoring/logs \
  monitoring/metrics \
  monitoring/opentelemetry \
  monitoring/prometheus \
  monitoring/sentry

touch \
  monitoring/prometheus/prometheus.yml \
  monitoring/grafana/datasources.yml \
  monitoring/opentelemetry/collector.yml \
  monitoring/alerts/application.yml \
  monitoring/alerts/security.yml \
  monitoring/alerts/billing.yml

# ============================================================
# SECURITY AND PRIVACY
# ============================================================

make_dirs \
  security/audit \
  security/incident-response \
  security/policies \
  security/privacy \
  security/threat-models

touch \
  security/policies/ACCESS_CONTROL.md \
  security/policies/EMPLOYEE_DATA_ACCESS.md \
  security/policies/SECURE_DEVELOPMENT.md \
  security/policies/VULNERABILITY_MANAGEMENT.md \
  security/privacy/CONSENT_MODEL.md \
  security/privacy/CHILD_SAFETY.md \
  security/privacy/DATA_CLASSIFICATION.md \
  security/privacy/DATA_RETENTION.md \
  security/privacy/PRIVACY_BY_DESIGN.md \
  security/threat-models/API.md \
  security/threat-models/ACTIVITY_MONITORING.md \
  security/threat-models/BILLING.md \
  security/threat-models/AI_SYSTEMS.md \
  security/incident-response/PLAYBOOK.md

# ============================================================
# DOCUMENTATION
# ============================================================

make_dirs \
  docs/ai \
  docs/api \
  docs/architecture \
  docs/backend \
  docs/billing \
  docs/brand \
  docs/data \
  docs/deployment \
  docs/design \
  docs/developer \
  docs/extension \
  docs/frontend \
  docs/infrastructure \
  docs/mobile \
  docs/monitoring \
  docs/privacy \
  docs/product \
  docs/roadmap \
  docs/security \
  docs/testing

cat > docs/design/PAGE_MAP.md <<'EOF'
# AIMERS OS V2 Page Map

## Student application

1. Dashboard
2. AI Mentor
3. Behavior AI
4. Digital Activity
5. Planner
6. Subjects
7. Analytics
8. Prediction
9. Memory Engine
10. Question Bank
11. Mock Tests
12. Flashcards
13. Notes
14. Research AI
15. Community
16. Achievements
17. Settings

## Student dashboard modules

- Study Streak
- AI Score
- Study Time
- Questions Solved
- Accuracy
- Today's Mission
- Embedded AI Mentor
- AIMERS Brain
- AI Insights
- Digital Activity Monitor
- Study Analytics
- Subject-Wise Progress
- Weak Topics
- Predicted Performance
- Memory Engine
- Quick Actions
- AI Voice Assistant

## Company administration

- Company Overview
- Revenue
- Subscriptions
- Customers
- Students
- Cohorts
- Rankers
- Mentors
- Staff
- Learning Analytics
- Product Analytics
- Behavior Analytics
- Digital Activity Analytics
- AI Operations
- Predictions
- Experiments
- Interventions
- Privacy
- Audit Logs
- Security
- System Health
EOF

cat > docs/design/UI_SYSTEM.md <<'EOF'
# AIMERS OS V2 UI System

## Visual direction

- Premium dark AI learning operating system
- Deep navy and black backgrounds
- Violet, purple and electric-blue gradients
- Pink accent gradients
- Cyan information states
- Green success states
- Orange warning states
- Red danger states
- Glass panels
- Thin luminous borders
- Soft neon shadows
- Rounded premium cards
- Responsive desktop, tablet and mobile layouts

## Responsive targets

- Large desktop: 1440px and above
- Laptop: 1024px to 1439px
- Tablet: 768px to 1023px
- Mobile: 390px to 767px
EOF

touch \
  docs/product/PRODUCT_VISION.md \
  docs/product/PRODUCT_REQUIREMENTS.md \
  docs/product/USER_ROLES.md \
  docs/product/SUBSCRIPTION_PLANS.md \
  docs/product/FEATURE_MATRIX.md \
  docs/product/STUDENT_JOURNEYS.md \
  docs/product/ADMIN_JOURNEYS.md \
  docs/product/MENTOR_JOURNEYS.md \
  docs/design/DESIGN_TOKENS.md \
  docs/design/COMPONENT_LIBRARY.md \
  docs/design/DASHBOARD_SPEC.md \
  docs/design/RESPONSIVE_RULES.md \
  docs/design/ACCESSIBILITY.md \
  docs/architecture/SYSTEM_OVERVIEW.md \
  docs/architecture/MONOREPO.md \
  docs/architecture/SERVICE_MAP.md \
  docs/architecture/EVENT_ARCHITECTURE.md \
  docs/architecture/REALTIME_ARCHITECTURE.md \
  docs/architecture/ACTIVITY_MONITORING.md \
  docs/backend/API_STANDARDS.md \
  docs/backend/ERROR_HANDLING.md \
  docs/backend/REPOSITORY_PATTERN.md \
  docs/billing/BILLING_ARCHITECTURE.md \
  docs/billing/ENTITLEMENTS.md \
  docs/billing/WEBHOOKS.md \
  docs/ai/AI_ARCHITECTURE.md \
  docs/ai/AI_MENTOR.md \
  docs/ai/BEHAVIOR_AI.md \
  docs/ai/MEMORY_ENGINE.md \
  docs/ai/PREDICTION_ENGINE.md \
  docs/ai/PROMPT_MANAGEMENT.md \
  docs/ai/AI_EVALUATION.md \
  docs/privacy/CONSENT.md \
  docs/privacy/DATA_ACCESS.md \
  docs/privacy/AGE_VERIFICATION.md \
  docs/privacy/DATA_DELETION.md \
  docs/security/AUTHENTICATION.md \
  docs/security/AUTHORIZATION.md \
  docs/security/AUDIT_LOGGING.md \
  docs/deployment/DEVELOPMENT.md \
  docs/deployment/STAGING.md \
  docs/deployment/PRODUCTION.md \
  docs/roadmap/PHASE_1_FOUNDATION.md \
  docs/roadmap/PHASE_2_CORE_LEARNING.md \
  docs/roadmap/PHASE_3_AI.md \
  docs/roadmap/PHASE_4_MONITORING.md \
  docs/roadmap/PHASE_5_SCALE.md

# ============================================================
# TESTING
# ============================================================

make_dirs \
  tests/accessibility \
  tests/contract \
  tests/e2e/admin \
  tests/e2e/auth \
  tests/e2e/billing \
  tests/e2e/marketing \
  tests/e2e/staff \
  tests/e2e/student \
  tests/fixtures \
  tests/integration/activity \
  tests/integration/ai \
  tests/integration/billing \
  tests/integration/database \
  tests/integration/notifications \
  tests/integration/subscriptions \
  tests/load/api \
  tests/load/events \
  tests/load/realtime \
  tests/performance \
  tests/security/authorization \
  tests/security/consent \
  tests/security/data-access \
  tests/security/rate-limits \
  tests/unit

touch \
  tests/README.md \
  tests/e2e/student/dashboard.spec.ts \
  tests/e2e/auth/login.spec.ts \
  tests/security/authorization/roles.spec.ts \
  tests/security/consent/activity-monitoring.spec.ts

# ============================================================
# TOOLING
# ============================================================

make_dirs \
  tooling/eslint \
  tooling/git-hooks \
  tooling/generators \
  tooling/prettier \
  tooling/typescript \
  tooling/vite

touch \
  tooling/eslint/base.js \
  tooling/prettier/index.js \
  tooling/typescript/base.json \
  tooling/vite/base.ts

# ============================================================
# LOCAL STORAGE
# ============================================================

make_dirs \
  storage/exports \
  storage/imports \
  storage/local \
  storage/private \
  storage/public \
  storage/temp \
  storage/uploads

touch \
  storage/exports/.gitkeep \
  storage/imports/.gitkeep \
  storage/local/.gitkeep \
  storage/private/.gitkeep \
  storage/public/.gitkeep \
  storage/temp/.gitkeep \
  storage/uploads/.gitkeep \
  database/backups/.gitkeep \
  database/snapshots/.gitkeep

# Preserve directories in Git.
while IFS= read -r empty_directory; do
  touch "${empty_directory}/.gitkeep"
done < <(
  find . \
    -type d \
    -empty \
    -not -path "./.git*" \
    -not -path "./node_modules*"
)

# ============================================================
# GIT
# ============================================================

if [ ! -d .git ]; then
  git init >/dev/null
fi

git branch -M main

echo
echo "============================================================"
echo "AIMERS OS V2 structure created successfully."
echo "============================================================"
echo
echo "Applications:"
find apps \
  -mindepth 1 \
  -maxdepth 1 \
  -type d \
  | sort

echo
echo "Student pages:"
find apps/web/src/pages \
  -mindepth 1 \
  -maxdepth 1 \
  -type d \
  | sort

echo
echo "Next: verify the structure and commit it."
echo
