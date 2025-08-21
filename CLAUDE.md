# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev     # Start development server at http://localhost:3000
npm run build   # Build production version
npm run start   # Start production server
npm run lint    # Run ESLint code quality checks
```

## Architecture Overview

This is a Next.js 14 TypeScript application implementing dual authentication (NodeLoc OAuth2 + Admin accounts) with a comprehensive lottery system for the ZZYU投喂站 platform.

### Core Systems

1. **Dual Authentication System** - NodeLoc OAuth2 + Admin accounts
2. **Lucky Wheel Lottery System** - Daily lottery with redemption codes
3. **Admin Management Panel** - Code management, user administration
4. **Data Persistence Layer** - JSON-based with multiple database migration options

### Dual Authentication System

The application supports two distinct authentication methods:

1. **NodeLoc OAuth2 Flow**: External OAuth2 integration
   - `src/contexts/AuthContext.tsx` - Initiates OAuth2 flow via `login()` function
   - `src/pages/api/auth/callback.ts` - Handles OAuth2 callback and token exchange
   - Endpoints: `https://conn.nodeloc.cc/oauth2/*`
   - State parameter validation (minimum 8 characters) for CSRF protection

2. **Admin Account System**: Internal username/password authentication
   - `src/pages/api/auth/admin-login.ts` - Handles admin authentication
   - `src/components/LoginForm.tsx` - Dual-mode login interface with tab switching
   - Admin accounts configured in `ADMIN_ACCOUNTS` array (single account: `zzyu`)

3. **Unified User Management**:
   - `src/pages/api/auth/user.ts` - Validates authentication state for both login types
   - `src/pages/api/auth/logout.ts` - Clears all authentication tokens and session data
   - User interface includes `isAdmin` flag for role-based UI rendering

### Lucky Wheel Lottery System

**Core Components**:
- `src/pages/lottery.tsx` - Interactive spinning wheel with SVG-based prize wheel
- `src/pages/my-codes.tsx` - User redemption code management
- `src/pages/lottery-history.tsx` - User lottery attempt history

**API Architecture**:
- `/api/lottery/spin` - Handles lottery spins with server-side prize determination
- `/api/lottery/attempts` - Manages daily attempt limits (5 attempts per user per day)
- `/api/lottery/my-codes` - Retrieves user's redemption codes
- `/api/lottery/verify` - Verification system for lottery integrity

**Prize System**:
- 5 prize tiers: 一等奖(40次), 二等奖(30次), 三等奖(20次), 四等奖(10次), 谢谢惠顾(0次)
- Configurable probabilities: 1st(5%), 2nd(10%), 3rd(15%), 4th(20%), None(50%)
- Value units in "次" (times/attempts) rather than currency
- Server-side prize determination with client-side wheel animation synchronization

**Wheel Mechanics**:
- SVG-based wheel with precise angle calculations
- Prize segments ordered by ID for consistency between frontend and backend
- Realistic spinning animation (8-12 rotations with easing)
- Pointer verification system ensures visual result matches server result

### Admin Management System

**Admin Interface**: `src/pages/admin/codes.tsx`
- Redemption code inventory management (import/export/statistics)
- Batch code import with duplicate detection
- Real-time stock levels by prize value
- Administrative statistics dashboard

**Admin API Routes**:
- `/api/admin/codes/stats` - Code inventory statistics
- `/api/admin/codes/import` - Batch import redemption codes

**Access Control**:
- Admin-only routes protected by `isAdmin` flag verification
- Admin panel accessible from dashboard for authorized users
- Role-based UI rendering with admin badges and styling

### Data Persistence Architecture

**Current Implementation**: JSON file-based storage in `data/` directory
- `lottery-attempts.json` - User daily attempt tracking
- `redemption-codes.json` - Code inventory and distribution records
- `lottery-verification.json` - Lottery integrity verification logs

**Production Migration Options**: Available in `database-configs/`
- **Vercel KV (Redis)** - Recommended for Vercel deployment
- **Vercel Postgres** - Relational database option
- **MongoDB Atlas** - Document-based NoSQL
- **Supabase** - Open-source Firebase alternative
- **Vercel Blob** - File-based storage for Vercel

**Migration Strategy**:
- `database-configs/migrate.ts` - Automated migration scripts
- `database-configs/migration-guide.md` - Step-by-step migration instructions
- Each database option includes complete utility functions and API examples

### Token Storage Strategy

- **HTTP-only cookies** for access tokens (security)
- **Readable cookies** for user data (client-side access)
- **login_type cookie** tracks authentication method (`oauth` vs `admin`)
- **Refresh tokens** with 30-day expiration for OAuth2 sessions
- Admin sessions use 24-hour token expiration

### Environment Configuration

**Required Variables**:
```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=     # NodeLoc app Client ID
OAUTH_CLIENT_SECRET=             # NodeLoc app Client Secret (server-side only)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=  # OAuth2 callback URL
NEXTAUTH_URL=                    # Application base URL
NEXTAUTH_SECRET=                 # Session encryption key
```

**Database Options** (choose one):
```env
# Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Vercel Postgres  
POSTGRES_URL=

# MongoDB Atlas
MONGODB_URI=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
```

### Component Architecture

**Page Structure**:
- `src/pages/index.tsx` - Dual-mode login page with OAuth error handling
- `src/pages/dashboard.tsx` - Main dashboard with lottery, codes, and admin access
- `src/pages/lottery.tsx` - Interactive lottery wheel with spin mechanics
- `src/pages/my-codes.tsx` - User redemption code history and management
- `src/pages/admin/codes.tsx` - Admin code inventory management

**UI Patterns**:
- Admin users: red avatar background + "管理员" badge
- Regular users: blue avatar background  
- Responsive design with mobile-first approach
- Toast notifications for user feedback
- Loading states and spin animations

### API Route Design

**Authentication Endpoints**:
- `/api/auth/callback` - OAuth2 callback processing
- `/api/auth/admin-login` - Admin credential validation
- `/api/auth/user` - Unified user validation with `isAdmin` field
- `/api/auth/logout` - Complete session cleanup

**Lottery System Endpoints**:
- `/api/lottery/spin` - Server-side lottery execution with verification
- `/api/lottery/attempts` - Daily attempt limit management
- `/api/lottery/my-codes` - User redemption code retrieval
- `/api/lottery/verify` - Lottery result verification system

**Admin Endpoints**:
- `/api/admin/codes/stats` - Inventory statistics
- `/api/admin/codes/import` - Batch code import

### Security Implementation

**Authentication Security**:
- HTTP-only cookies prevent XSS token access
- SameSite cookie protection against CSRF
- NodeLoc OAuth2 state parameter validation
- Admin credentials stored server-side only

**Lottery Integrity**:
- Server-side prize determination prevents client manipulation
- Verification logging for audit trails
- Daily attempt limits with server-side enforcement
- Redemption code uniqueness and distribution tracking

### Deployment Configuration

**Vercel Setup**:
- `vercel.json` configures HKG/SIN regions for optimal performance
- Environment variable mapping with `@` prefixes for Vercel secrets
- API route timeout: 30 seconds for OAuth2 operations
- Static file serving for wheel graphics and animations

**Data Persistence Notes**:
- Development uses JSON files in `data/` directory
- Production deployment requires database migration (see `database-configs/`)
- Vercel's serverless nature requires external database for data persistence

### Development Patterns

**State Management**:
- React Context for centralized auth state
- Local state for lottery wheel animations and UI interactions
- Cookie-based persistence with client-side synchronization

**Form Handling**:
- React Hook Form for validation in login and admin forms
- Proper disabled states during async operations
- Toast notifications for immediate user feedback

**Lottery System Patterns**:
- Server-authoritative game logic with client visualization
- Precise angle calculations for wheel-to-prize alignment
- Verification systems for ensuring visual matches actual results
- Real-time inventory management with optimistic updates