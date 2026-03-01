# Uni Match SG

A production-ready MVP web app for Singapore A Level students (AY2026 admissions) to:
1. Calculate their University Admission Score (UAS) under the 70-rank-point system
2. Take an interests quiz to discover suitable degree courses
3. Get personalised recommendations for NUS, NTU, SMU courses with chance labels and eligibility tiers

## Features

- **RP/UAS Calculator**: Core 70-point system with optional rebasing for 4th subject and Mother Tongue
- **Interests Quiz**: 12 questions mapping to 16 interest tags + 6 preference flags
- **University Style Quiz**: 4 questions to determine learning format preferences
- **Recommendation Engine**: Eligibility-first ranking with 5 tiers, chance labels (High/Medium/Low), and Reach/Match/Safe buckets
- **ABA Advisory**: Portfolio-based recommendation for Aptitude-Based Admissions
- **Filters**: 9 adjustable filters for refining recommendations
- **Citations**: Source URLs for every factual dataset (IGP, salary, prerequisites, etc.)
- **Admin Panel**: Upload CSV/JSON to update course data with validation

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **ORM**: Prisma with SQLite (MVP), designed for Postgres migration
- **State**: Zustand (client-side, no login required)
- **Hosting**: Vercel-compatible

## Setup

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Generate Prisma client and create database
npx prisma generate
npx prisma db push

# 4. Seed the database with starter data
npm run seed

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000` to use the app.

### Admin Panel

Visit `/admin` and enter the `ADMIN_KEY` from your `.env` file.

## Data Management

### Yearly Updates Required

The following data should be updated annually:

| Data | Source | When |
|------|--------|------|
| IGP (Indicative Grade Profile) | University admissions pages | After each admissions cycle (usually May–June) |
| GES (Graduate Employment Survey) | MOE/university GES reports | Published annually (~February) |
| Intake sizes | University annual reports | Yearly |
| Prerequisites | University programme pages | Check before each cycle |

### How to Update Data

#### Option 1: Edit seed data
1. Update `data/courses.json` with new values
2. Run `npm run seed` to reload

#### Option 2: CSV import
1. Prepare a CSV file (see `data/sample-import.csv` for format)
2. Run `npm run import:csv -- path/to/file.csv`

#### Option 3: Admin panel
1. Go to `/admin`
2. Upload a JSON file with course updates

### Citation URLs

Every factual field should have a corresponding source URL. When updating data:
- IGP: Link to the university's official IGP page
- Salary/Employment: Link to the MOE GES survey or university career page
- Prerequisites: Link to the programme's admission requirements page
- Curriculum: Link to the programme's official page

### Key Data Sources

- **NUS IGP**: https://www.nus.edu.sg/oam/undergraduate-programmes/indicative-grade-profile
- **NTU IGP**: https://www.ntu.edu.sg/admissions/undergraduate/indicative-grade-profile
- **SMU IGP**: https://admissions.smu.edu.sg/admissions-requirements/indicative-grade-profiles
- **MOE GES**: https://www.moe.gov.sg/post-secondary/overview

## Project Structure

```
├── data/                     # Seed data JSON files
│   ├── courses.json          # Course data with all fields
│   └── universities.json     # University records
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   ├── seed.ts               # Database seeder
│   └── import-csv.ts         # CSV import script
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page
│   │   ├── results-input/    # Step 1: Enter grades
│   │   ├── quiz/             # Step 2: Interests quiz
│   │   ├── uni-style-quiz/   # Step 2b: University style quiz
│   │   ├── recommendations/  # Step 3: Course recommendations
│   │   ├── course/[slug]/    # Course detail page
│   │   ├── admin/            # Admin panel
│   │   └── api/              # API routes
│   ├── components/           # Reusable UI components
│   └── lib/
│       ├── rp-calculator.ts  # RP/UAS calculation engine
│       ├── quiz-engine.ts    # Interests quiz scoring
│       ├── uni-style-quiz.ts # University style quiz
│       ├── store.ts          # Zustand state store
│       ├── prisma.ts         # Prisma client singleton
│       ├── constants.ts      # Shared constants
│       ├── db-helpers.ts     # Database utility functions
│       ├── reco/
│       │   ├── config.ts     # Recommendation scoring config
│       │   └── engine.ts     # Recommendation engine
│       └── __tests__/        # Unit tests
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch
```

Tests cover:
- RP calculator (all grade combinations, rebasing scenarios)
- Chance label logic (boundary conditions)
- Prerequisite checking
- ABA advisory logic
- Eligibility tier assignment
- Portfolio scoring

## Disclaimer

This tool provides **estimates only** based on publicly available data. Actual admission outcomes depend on many factors. Always refer to official university sources for the most accurate and up-to-date information. The chance labels and recommendations are indicative and should not be taken as guarantees.

## License

MIT
