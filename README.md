# Draftly MVP - College Essay Coaching Platform

A production-ready SaaS platform for college essay coaching with application tracking, draft versioning, and structured feedback.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe (to be integrated)
- **Deployment**: Vercel-ready

## Current Implementation Status

### ✅ Phase 1: Core Infrastructure (Complete)

- Next.js 14 project setup with TypeScript and Tailwind CSS
- Prisma schema with all models (User, Application, Essay, Draft, Feedback, etc.)
- NextAuth.js authentication with credentials provider
- Role-based access control (STUDENT, COACH, ADMIN)
- Middleware for protected routes
- shadcn/ui component library

### ✅ Phase 2: Student Experience (Complete)

#### Dashboard (`/dashboard`)
- Summary cards showing total applications, essays in progress, and upcoming deadlines
- Quick actions for adding applications and starting new essays
- Recent essays feed with status badges
- Upcoming deadline countdown

#### Applications Management (`/dashboard/applications`)
- Full CRUD operations for college applications
- Table view with school name, deadline, status, and essay count
- Add/Edit/Delete modals
- Status tracking (Not Started, In Progress, Submitted)
- Deadline sorting

#### Essay Management (`/dashboard/essays`)
- Grid view of all essays with filtering by status
- Create new essay dialog with optional application linking
- Status badges and word counts
- Filter by Draft, Submitted, In Review, Needs Revision, Approved

#### Essay Editor (`/dashboard/essays/[id]`)
- Rich textarea with auto-save (2-second debounce)
- Live word count tracking
- Version history sidebar showing all drafts
- Manual save button
- Submit for review functionality
- Read-only mode for submitted/reviewed essays
- Save status indicator (Saved, Saving, Unsaved)

#### Feedback View (`/dashboard/essays/[id]/feedback`)
- Two-pane layout: Essay content (left) + Feedback panel (right)
- Inline comment highlighting with hover tooltips
- Summary feedback, strengths, priority revisions, and overall guidance sections
- Multiple feedback version selector
- "Start Revision" button for essays needing revision

### ✅ Phase 3: Coach Experience (Complete)

#### Coach Dashboard (`/coach`)
- Summary cards: Pending reviews, total students, essays reviewed, turnaround time
- Review queue table with priority sorting by deadline
- Student info, essay details, and submission time
- Recent feedback history
- Quick links to review, students, and packages

#### Essay Review Page (`/coach/review/[essayId]`)
- Two-pane layout: Essay content (60%) + Feedback form (40%)
- **Interactive inline commenting**: Select text to add comments
- Inline comments with hover tooltips
- Comment management (add/remove)
- Structured feedback form:
  - Summary feedback (required)
  - Strengths
  - Priority revisions
  - Overall guidance
  - Status selection (Needs Revision, Approved, In Review)
- Submit feedback to student

#### Student Roster (`/coach/students`)
- Table view of all students
- Package information and credits remaining
- Essay counts and last activity tracking
- Student contact information

#### Package Management (`/coach/packages`)
- Full CRUD for pricing packages
- Set name, review credits, and price
- Activate/deactivate packages
- Pricing displayed in USD

### 🚧 Phase 4: Payment Integration (Not Started)

**Still To Build:**
- Stripe checkout flow
- Webhook handler for payment events
- Credit system implementation
- Package purchase UI

### 🚧 Phase 5: Polish (Partially Complete)

**Complete:**
- Toaster component for notifications
- Loading states
- Error handling
- Form validation

**Still To Build:**
- Email notifications
- Navigation component
- Breadcrumbs
- Enhanced error boundaries

## Database Schema

The complete Prisma schema includes:

- **User**: Authentication and profile data with role (STUDENT, COACH, ADMIN)
- **CoachProfile**: Coach-specific settings (turnaround time, bio, availability)
- **StudentCoach**: Junction table managing coach-student relationships and credits
- **Package**: Coach pricing packages (review credits, price)
- **Application**: College applications with deadlines and status
- **Essay**: Essays with title, prompt, status, word count
- **Draft**: Version-controlled essay content
- **Feedback**: Coach feedback with inline comments and structured guidance
- **Subscription**: Stripe subscription tracking

## API Routes

### Authentication
- `POST /api/signup` - User registration with role selection
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Applications
- `GET /api/applications` - List user's applications
- `POST /api/applications` - Create new application
- `PATCH /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Delete application

### Essays
- `GET /api/essays` - List user's essays with latest draft
- `POST /api/essays` - Create new essay
- `GET /api/essays/[id]` - Get essay with drafts and feedback
- `PATCH /api/essays/[id]` - Update essay metadata
- `DELETE /api/essays/[id]` - Delete essay
- `POST /api/essays/[id]/drafts` - Save new draft version
- `POST /api/essays/[id]/submit` - Submit essay for review

### Feedback
- `GET /api/feedback?essayId=...` - Get feedback for an essay
- `POST /api/feedback` - Create new feedback (coaches only)

### Packages
- `GET /api/packages` - List packages (optionally filter by coachId)
- `POST /api/packages` - Create new package (coaches only)
- `PATCH /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/draftly"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

3. **Generate NextAuth secret:**
   ```bash
   openssl rand -base64 32
   ```

4. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   Navigate to `http://localhost:3000`

### Database Seeding (Optional)

To create test users and data:

```bash
npx prisma studio
```

Manually create users via the signup page or Prisma Studio.

## User Flows

### Student Flow

1. **Sign Up** → Select "Student" role
2. **Dashboard** → View summary and quick actions
3. **Add Application** → Enter school name and deadline
4. **Create Essay** → Link to application, add title and prompt
5. **Write Essay** → Auto-saving editor with version history
6. **Submit for Review** → Changes status to "Submitted"
7. **View Feedback** → See coach comments and revisions
8. **Start Revision** → Create new draft based on feedback

### Coach Flow

1. **Sign Up** → Select "Coach" role
2. **Dashboard** → View pending reviews in priority queue
3. **Review Essay** → Select text for inline comments, fill feedback form
4. **Submit Feedback** → Student receives feedback, essay status updated
5. **Manage Packages** → Create/edit pricing packages
6. **View Students** → Track student roster and credits

## Key Features

### Auto-Save System
- Debounced auto-save every 2 seconds
- Local state management before API call
- Save status indicator
- Manual save override option

### Version Control
- Each save creates a new Draft with incremented version number
- Version history accessible in sidebar
- Click to load previous versions
- Feedback tied to specific draft versions

### Role-Based Access
- Middleware protects routes by user role
- Students see `/dashboard` routes
- Coaches see `/coach` routes
- Automatic redirect based on role

### Status Management
Essay statuses:
- **DRAFT** - Being written
- **SUBMITTED** - Awaiting coach review
- **IN_REVIEW** - Coach is reviewing
- **NEEDS_REVISION** - Coach provided feedback
- **APPROVED** - Essay is complete

## File Structure

```
app/
├── (auth)/
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── signup/route.ts
│   ├── applications/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── essays/
│       ├── route.ts
│       └── [id]/
│           ├── route.ts
│           ├── drafts/route.ts
│           └── submit/route.ts
├── dashboard/
│   ├── page.tsx
│   ├── applications/page.tsx
│   └── essays/
│       ├── page.tsx
│       └── [id]/
│           ├── page.tsx
│           └── feedback/page.tsx
├── layout.tsx
└── page.tsx
lib/
├── auth.ts
└── prisma.ts
prisma/
└── schema.prisma
components/
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── badge.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── select.tsx
    ├── textarea.tsx
    ├── skeleton.tsx
    └── sonner.tsx
```

## Next Steps (Remaining Work)

### High Priority

1. **Stripe Integration**
   - Checkout session creation API
   - Webhook handler for payment events
   - Credit allocation to StudentCoach
   - Package purchase UI for students
   - Payment success/failure pages

2. **Credit System Implementation**
   - Decrement credits on feedback submission
   - Block reviews when credits = 0
   - Show credit warnings to students
   - Credit purchase flow

3. **Email Notifications**
   - Essay submitted → notify coach
   - Feedback received → notify student
   - Deadline reminders (3 days before)
   - Credits running low notification

### Medium Priority

4. **Enhanced UI/UX**
   - Shared navigation component
   - Breadcrumbs for nested pages
   - Better mobile responsiveness
   - Dark mode support

5. **Testing**
   - Unit tests for API routes
   - Integration tests for user flows
   - E2E tests with Playwright
   - Load testing for scalability

### Low Priority

6. **Additional Features**
   - Coach availability calendar
   - Student-coach messaging
   - Essay templates
   - Analytics dashboard
   - Export essays to PDF

## Testing Checklist

### Student Flow
- [ ] User can sign up as student
- [ ] Student can add applications
- [ ] Student can create essays
- [ ] Auto-save works in editor (2-second debounce)
- [ ] Version history shows correctly
- [ ] Submit essay changes status to SUBMITTED
- [ ] Student can view feedback with inline comments
- [ ] Student can start revision from feedback

### Coach Flow
- [ ] User can sign up as coach
- [ ] Coach can view review queue sorted by deadline
- [ ] Coach can select text and add inline comments
- [ ] Coach can submit structured feedback
- [ ] Feedback appears for student immediately
- [ ] Essay status updates after feedback submission
- [ ] Coach can create/edit/delete packages
- [ ] Coach can view student roster

### Payment Flow (Not Yet Implemented)
- [ ] Student can purchase package
- [ ] Stripe payment processes correctly
- [ ] Credits allocated to student
- [ ] Credits decrement on feedback submission

## Deployment

### Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Import project from GitHub
   - Add environment variables
   - Deploy

3. **Set up production database:**
   - Create Supabase/Neon/Railway PostgreSQL instance
   - Update `DATABASE_URL` in Vercel
   - Run `npx prisma db push` from local with production DB URL

4. **Configure Stripe webhook:**
   - Add Vercel URL to Stripe webhook endpoints
   - Update `STRIPE_WEBHOOK_SECRET`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
