# JenkInsAITB Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JENKINSA ITB SYSTEM                                 │
│                     Jenkins AI Troubleshooting Bot                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Dashboard   │  │   Jobs       │  │  Agents      │  │  Analytics   │   │
│  │              │  │              │  │              │  │              │   │
│  │  • KPIs      │  │  • Job List  │  │  • Status    │  │  • Charts    │   │
│  │  • Metrics   │  │  • Triggers  │  │  • Resources │  │  • Reports   │   │
│  │  • Alerts    │  │  • History   │  │  • Labels    │  │  • Trends    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │                  │           │
│         └──────────────────┴──────────────────┴──────────────────┘           │
│                                     │                                         │
│                                     ▼                                         │
│         ┌────────────────────────────────────────────────────┐               │
│         │         🧠 Smart Log Analyzer (NEW!)               │               │
│         │                                                     │               │
│         │  ┌────────────────┐  ┌─────────────────────────┐ │               │
│         │  │  Pattern       │  │  Analysis Results       │ │               │
│         │  │  Recognition   │  │                         │ │               │
│         │  │                │  │  • Root Cause           │ │               │
│         │  │  20+ Patterns  │─▶│  • Categorized Issues   │ │               │
│         │  │  • Maven       │  │  • Fix Suggestions      │ │               │
│         │  │  • Docker      │  │  • Doc Links            │ │               │
│         │  │  • Network     │  │  • Estimated Fix Time   │ │               │
│         │  │  • Tests       │  │  • Jump-to-Error        │ │               │
│         │  └────────────────┘  └─────────────────────────┘ │               │
│         └────────────────────────────────────────────────────┘               │
│                                                                               │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
                                │ tRPC API Calls
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Fastify + tRPC)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      Router Layer                                 │       │
│  │                                                                    │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│       │
│  │  │  Jenkins    │  │   Logs      │  │  Agents     │  │Analytics ││       │
│  │  │  Router     │  │   Router    │  │  Router     │  │ Router   ││       │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬────┘│       │
│  │         │                 │                 │               │     │       │
│  └─────────┼─────────────────┼─────────────────┼───────────────┼─────┘       │
│            │                 │                 │               │             │
│            └─────────────────┴─────────────────┴───────────────┘             │
│                                      │                                        │
│                                      ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      Service Layer                                │       │
│  │                                                                    │       │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────┐│       │
│  │  │  Jenkins Sync      │  │  Log Proxy         │  │  Analytics  ││       │
│  │  │  Service           │  │  Service           │  │  Service    ││       │
│  │  │                    │  │                    │  │             ││       │
│  │  │  • Polls Jenkins   │  │  • Fetches Logs    │  │  • KPIs     ││       │
│  │  │  • Updates DB      │  │  • Adds Auth       │  │  • Metrics  ││       │
│  │  │  • Every 5 sec     │  │  • Removes CORS    │  │  • Trends   ││       │
│  │  └────────┬───────────┘  └────────┬───────────┘  └──────┬──────┘│       │
│  │           │                       │                      │        │       │
│  └───────────┼───────────────────────┼──────────────────────┼────────┘       │
│              │                       │                      │                │
│              └───────────────────────┴──────────────────────┘                │
│                                      │                                        │
│                                      ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      Data Layer (Prisma)                          │       │
│  │                                                                    │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │       │
│  │  │  Jenkins   │  │   Jobs     │  │  Builds    │  │   Users    │ │       │
│  │  │  Instances │  │            │  │            │  │            │ │       │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │       │
│  │                                                                    │       │
│  │  Database: SQLite (dev) / PostgreSQL (prod)                       │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
                                │ HTTP/REST API Calls
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          JENKINS INSTANCES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │   Jenkins 1         │  │   Jenkins 2         │  │   Jenkins N         │ │
│  │   (Primary)         │  │   (Secondary)       │  │   (...)             │ │
│  │                     │  │                     │  │                     │ │
│  │  • Jobs API         │  │  • Jobs API         │  │  • Jobs API         │ │
│  │  • Build API        │  │  • Build API        │  │  • Build API        │ │
│  │  • Computer API     │  │  • Computer API     │  │  • Computer API     │ │
│  │  • Console Logs     │  │  • Console Logs     │  │  • Console Logs     │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

1. Smart Log Analysis Flow:
   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ User    │─────▶│ Smart   │─────▶│ Log     │─────▶│ Pattern │
   │ Clicks  │      │ Log     │      │ Fetch   │      │ Analyzer│
   │ Button  │      │ Viewer  │      │ (tRPC)  │      │         │
   └─────────┘      └────┬────┘      └────┬────┘      └────┬────┘
                         │                 │                 │
                         │                 ▼                 ▼
                         │      ┌──────────────┐   ┌────────────────┐
                         │      │   Jenkins    │   │  20+ Pattern   │
                         │      │   Logs       │   │  Database      │
                         │      │   API        │   │  (No AI!)      │
                         │      └──────────────┘   └────────┬───────┘
                         │                                   │
                         │                                   ▼
                         │                         ┌─────────────────┐
                         └─────────────────────────│  Analysis       │
                                                   │  • Root Cause   │
                                                   │  • Categories   │
                                                   │  • Suggestions  │
                                                   └─────────────────┘

2. Agent Monitoring Flow:
   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ User    │─────▶│ Agents  │─────▶│ Agent   │─────▶│ Jenkins │
   │ Visits  │      │ Page    │      │ API     │      │ Computer│
   │ /agents │      │         │      │ (tRPC)  │      │ API     │
   └─────────┘      └────┬────┘      └────┬────┘      └────┬────┘
                         │                 │                 │
                         │                 ▼                 ▼
                         │      ┌──────────────┐   ┌────────────────┐
                         │      │   Database   │   │  Real-time     │
                         │      │   Cache      │   │  Status        │
                         │      │              │   │  • Online      │
                         │      └──────────────┘   │  • Offline     │
                         │                         │  • Resources   │
                         │                         └────────┬───────┘
                         │                                   │
                         └───────────────────────────────────┘
                                   Display with Filters

3. Build Trigger Flow:
   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ User    │─────▶│ Job     │─────▶│ Jenkins │─────▶│ Jenkins │
   │ Triggers│      │ Detail  │      │ Client  │      │ Build   │
   │ Build   │      │ Page    │      │ Service │      │ API     │
   └─────────┘      └────┬────┘      └────┬────┘      └────┬────┘
                         │                 │                 │
                         │                 ▼                 ▼
                         │      ┌──────────────┐   ┌────────────────┐
                         │      │   Queue      │   │  Build Starts  │
                         │      │   Job        │   │                │
                         │      └──────────────┘   │  Sync Service  │
                         │                         │  Polls Status  │
                         │                         └────────┬───────┘
                         │                                   │
                         └───────────────────────────────────┘
                              Real-time Updates


═══════════════════════════════════════════════════════════════════════════════
                           KEY TECHNOLOGIES
═══════════════════════════════════════════════════════════════════════════════

Frontend:
  • React 18.3              - UI framework
  • React Router v6         - Navigation
  • tRPC Client            - Type-safe API calls
  • UnoCSS                 - Atomic CSS
  • Vite                   - Build tool
  • TypeScript 5+          - Type safety

Backend:
  • Fastify                - HTTP server
  • tRPC 11.6.0            - API framework
  • Prisma 6.16.3          - ORM
  • Axios                  - HTTP client
  • TypeScript 5+          - Type safety

Database:
  • SQLite (dev)           - Local development
  • PostgreSQL (prod)      - Production ready

Infrastructure:
  • Docker                 - Containerization
  • Jenkins API            - External integration
  • Prometheus (optional)  - Metrics
  • Git                    - Version control


═══════════════════════════════════════════════════════════════════════════════
                           PATTERN RECOGNITION ENGINE
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                      Log Analyzer Architecture                              │
└────────────────────────────────────────────────────────────────────────────┘

Input: Raw Console Logs (Plain Text)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Build Phase Detection                                     │
│  • Scan first 100 lines                                             │
│  • Match against phase patterns                                      │
│  • Identify: Checkout, Compilation, Testing, Build, Docker, Deploy  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2: Line-by-Line Analysis                                     │
│  • Iterate through all lines                                        │
│  • Apply 20+ regex patterns                                         │
│  • Extract error context                                            │
│  • Classify by category                                             │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 3: Issue Classification                                      │
│                                                                      │
│  Categories:                                                         │
│  ├─ Compilation (syntax, types, imports)                           │
│  ├─ Maven/Gradle (build failures)                                  │
│  ├─ Dependencies (missing artifacts)                                │
│  ├─ Tests (failures, assertions)                                   │
│  ├─ Network (timeouts, connections)                                 │
│  ├─ Docker (daemon, permissions)                                    │
│  ├─ Git/SCM (repo access)                                          │
│  ├─ Memory (heap, GC)                                              │
│  ├─ Disk (space)                                                    │
│  ├─ Permissions (file access)                                       │
│  └─ Language-specific (NPM, Python, etc.)                          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 4: Root Cause Analysis                                       │
│  • Prioritize critical errors                                       │
│  • Find first build-breaking issue                                  │
│  • Identify likely root cause                                       │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 5: Generate Recommendations                                   │
│  • Map error category to fix suggestions                            │
│  • Provide documentation links                                       │
│  • Suggest commands to run                                          │
│  • Estimate fix time                                                │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
         Output: LogAnalysisResult
         {
           issues: LogIssue[],
           summary: {
             totalErrors, totalWarnings,
             categories, likelyRootCause
           },
           buildPhase,
           estimatedFixTime
         }


═══════════════════════════════════════════════════════════════════════════════
                           DEPLOYMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

Development:
┌──────────────────────────────────────────────────────────────────────────┐
│  Local Machine                                                            │
│  ├─ Frontend: http://localhost:3000                                      │
│  ├─ Backend: http://localhost:3001                                       │
│  ├─ Database: SQLite file                                                │
│  └─ Jenkins: http://localhost:8058 (local instance)                      │
└──────────────────────────────────────────────────────────────────────────┘

Production (Recommended):
┌──────────────────────────────────────────────────────────────────────────┐
│  Cloud Provider (AWS, Azure, GCP)                                         │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Load Balancer (HTTPS)                                          │     │
│  └──────────────────────┬──────────────────────────────────────────┘     │
│                         │                                                 │
│           ┌─────────────┴─────────────┐                                  │
│           │                           │                                   │
│  ┌────────▼────────┐         ┌───────▼────────┐                         │
│  │  Frontend       │         │  Backend       │                          │
│  │  (Static)       │         │  (Container)   │                          │
│  │  - Vercel       │         │  - Docker      │                          │
│  │  - Netlify      │         │  - K8s Pod     │                          │
│  │  - S3+CF        │         │  - VM          │                          │
│  └─────────────────┘         └───────┬────────┘                          │
│                                      │                                    │
│                            ┌─────────┴─────────┐                         │
│                            │                   │                          │
│                   ┌────────▼────────┐  ┌──────▼──────┐                  │
│                   │   Database      │  │  Jenkins    │                   │
│                   │   PostgreSQL    │  │  Instances  │                   │
│                   │   (Managed)     │  │  (Multiple) │                   │
│                   └─────────────────┘  └─────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           SECURITY ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│  Authentication & Authorization Flow                                        │
│                                                                              │
│  User Login                                                                  │
│      │                                                                        │
│      ▼                                                                        │
│  ┌──────────────┐                                                           │
│  │  Login Page  │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                     │
│         ▼                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │  Auth Service    │────────▶│  User Database   │                          │
│  │  - Validate      │         │  - bcrypt hash   │                          │
│  │  - Generate JWT  │         │  - Salt rounds   │                          │
│  └────────┬─────────┘         └──────────────────┘                          │
│           │                                                                   │
│           ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │  JWT Token       │                                                        │
│  │  - Stored in     │                                                        │
│  │    localStorage  │                                                        │
│  │  - Sent in       │                                                        │
│  │    headers       │                                                        │
│  └────────┬─────────┘                                                        │
│           │                                                                   │
│           ▼                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │  Protected       │────────▶│  Auth Guard      │                          │
│  │  Routes          │         │  - Verify JWT    │                          │
│  │                  │         │  - Check role    │                          │
│  └──────────────────┘         └──────────────────┘                          │
│                                                                              │
│  Jenkins API Credentials:                                                    │
│  • Stored encrypted in database                                             │
│  • Never exposed to frontend                                                 │
│  • Used only in backend services                                            │
│  • Basic Auth for Jenkins API calls                                         │
└────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
Made with ❤️ by DevOps Engineers, for DevOps Engineers
Repository: https://github.com/nirwo/JenkInsAITB.git
═══════════════════════════════════════════════════════════════════════════════
