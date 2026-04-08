# VibeFinance - Architecture Diagrams

## 🏗️ System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser[Web Browser]
        PWA[PWA - Future]
    end
    
    subgraph Frontend["Frontend - React 19 + TypeScript"]
        Router[TanStack Router]
        Components[UI Components]
        Query[TanStack Query]
        State[Zustand Store]
    end
    
    subgraph Backend["Backend Services"]
        Supabase[Supabase]
        Polygon[Polygon.io API]
    end
    
    subgraph Data["Data Layer"]
        DB[(PostgreSQL)]
        Auth[Auth Service]
        Storage[Storage Buckets]
        Realtime[Realtime Subscriptions]
    end
    
    Browser --> Router
    Router --> Components
    Components --> Query
    Components --> State
    Query --> Supabase
    Query --> Polygon
    Supabase --> DB
    Supabase --> Auth
    Supabase --> Storage
    Supabase --> Realtime
```

---

## 🔄 Data Flow Architecture

### Portfolio Value Calculation Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant TanStack Query
    participant Cache
    participant Supabase
    participant Polygon
    
    User->>React: Opens Dashboard
    React->>TanStack Query: Request Portfolio Data
    TanStack Query->>Cache: Check Cache
    
    alt Cache Valid
        Cache-->>React: Return Cached Data
    else Cache Invalid/Missing
        TanStack Query->>Supabase: Fetch Holdings
        Supabase-->>TanStack Query: Holdings Data
        TanStack Query->>Polygon: Fetch Current Prices
        Polygon-->>TanStack Query: Price Data
        TanStack Query->>Cache: Update Cache
        Cache-->>React: Return Fresh Data
    end
    
    React->>User: Display Portfolio
    
    Note over TanStack Query,Cache: Auto-refetch every 60s
```

---

## 🗄️ Database Schema Relationships

```mermaid
erDiagram
    profiles ||--o{ portfolios : "owns"
    profiles ||--o{ watchlist : "tracks"
    profiles ||--o{ price_alerts : "sets"
    
    portfolios ||--o{ holdings : "contains"
    portfolios ||--o{ transactions : "records"
    
    assets ||--o{ holdings : "held in"
    assets ||--o{ transactions : "traded"
    assets ||--o{ watchlist : "watched"
    assets ||--o{ price_alerts : "monitored"
    
    profiles {
        uuid id PK
        text email
        text full_name
        jsonb preferences
        timestamptz created_at
    }
    
    portfolios {
        uuid id PK
        uuid user_id FK
        text name
        boolean is_default
        timestamptz created_at
    }
    
    assets {
        uuid id PK
        text ticker UK
        text name
        text asset_type
        text exchange
    }
    
    holdings {
        uuid id PK
        uuid portfolio_id FK
        uuid asset_id FK
        decimal quantity
        decimal average_cost
    }
    
    transactions {
        uuid id PK
        uuid portfolio_id FK
        uuid asset_id FK
        text transaction_type
        decimal quantity
        decimal price
        timestamptz transaction_date
    }
    
    watchlist {
        uuid id PK
        uuid user_id FK
        uuid asset_id FK
        decimal target_price
    }
```

---

## 🔐 Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> LoginPage : Navigate to Login
    Unauthenticated --> SignupPage : Navigate to Signup
    
    LoginPage --> Authenticating : Submit Credentials
    SignupPage --> Authenticating : Submit New Account
    
    Authenticating --> Authenticated : Success
    Authenticating --> LoginPage : Error - Login
    Authenticating --> SignupPage : Error - Signup
    
    Authenticated --> Dashboard : Redirect
    Dashboard --> [*] : Logout
    
    state Authenticated {
        [*] --> CheckSession
        CheckSession --> ValidSession : Token Valid
        CheckSession --> [*] : Token Invalid
        
        ValidSession --> CreateProfile : New User
        ValidSession --> LoadProfile : Existing User
        
        CreateProfile --> LoadProfile
        LoadProfile --> [*]
    }
```

---

## 📊 Component Hierarchy

```mermaid
graph TD
    App[App Root] --> Router[TanStack Router]
    
    Router --> Public[Public Routes]
    Router --> Protected[Protected Routes]
    
    Public --> Landing[Landing Page]
    Public --> Login[Login Page]
    Public --> Signup[Signup Page]
    
    Protected --> Layout[App Layout]
    
    Layout --> Sidebar[Sidebar Navigation]
    Layout --> Navbar[Top Navbar]
    Layout --> Content[Main Content]
    
    Content --> Dashboard[Dashboard]
    Content --> Portfolio[Portfolio]
    Content --> AssetDetail[Asset Detail]
    Content --> Watchlist[Watchlist]
    Content --> Insights[Insights]
    Content --> Settings[Settings]
    
    Dashboard --> PortfolioCard[Portfolio Value Card]
    Dashboard --> AllocationChart[Allocation Pie Chart]
    Dashboard --> TopMovers[Top Movers List]
    Dashboard --> RecentTx[Recent Transactions]
    
    Portfolio --> HoldingsTable[Holdings Table]
    Portfolio --> AddAssetDialog[Add Asset Dialog]
    Portfolio --> TxDrawer[Transaction Drawer]
    
    AssetDetail --> PriceHeader[Price Header]
    AssetDetail --> PriceChart[Interactive Chart]
    AssetDetail --> TimeRange[Time Range Selector]
    AssetDetail --> NewsSection[News Section]
```

---

## 🔄 State Management Strategy

```mermaid
graph LR
    subgraph Server State
        TQ[TanStack Query]
        QC[Query Cache]
    end
    
    subgraph Client State
        ZS[Zustand Store]
        LS[Local Storage]
    end
    
    subgraph Sources
        API1[Supabase API]
        API2[Polygon.io API]
    end
    
    API1 --> TQ
    API2 --> TQ
    TQ --> QC
    
    ZS --> LS
    
    QC -.Server Data.-> Components[React Components]
    ZS -.Client Data.-> Components
    
    style TQ fill:#10b981
    style ZS fill:#3b82f6
```

**Server State** - TanStack Query
- Portfolio data
- Asset prices
- Transactions
- User profile
- Market news

**Client State** - Zustand
- Theme preference
- UI state - modals, drawers
- Form state - temporary
- User preferences

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph Development
        Dev[Local Dev Server]
        Vite[Vite HMR]
    end
    
    subgraph GitHub
        Repo[Git Repository]
        Actions[GitHub Actions]
    end
    
    subgraph Vercel
        Build[Build Process]
        CDN[Edge CDN]
        Prod[Production]
        Preview[Preview Deployments]
    end
    
    subgraph External
        SB[Supabase Cloud]
        PG[Polygon.io]
    end
    
    Dev --> Repo
    Repo --> Actions
    Actions --> Build
    Build --> CDN
    CDN --> Prod
    CDN --> Preview
    
    Prod --> SB
    Prod --> PG
    Preview --> SB
    Preview --> PG
    
    style Prod fill:#10b981
    style Preview fill:#3b82f6
```

---

## 📱 Responsive Design Breakpoints

```mermaid
graph LR
    Mobile[Mobile < 640px] --> Tablet[Tablet 640-1024px]
    Tablet --> Desktop[Desktop 1024-1536px]
    Desktop --> Wide[Wide > 1536px]
    
    Mobile -.Single Column.-> Layout1[Stacked Layout]
    Tablet -.Two Columns.-> Layout2[Mixed Layout]
    Desktop -.Sidebar + Main.-> Layout3[Full Layout]
    Wide -.Sidebar + Wide Main.-> Layout4[Spacious Layout]
```

**Mobile** - sm: 640px
- Single column
- Hamburger menu
- Stacked cards
- Compact charts

**Tablet** - md: 768px, lg: 1024px
- Two columns
- Collapsible sidebar
- Grid layouts
- Medium charts

**Desktop** - xl: 1280px
- Full sidebar
- Multi-column grids
- Large charts
- All features visible

**Wide** - 2xl: 1536px
- Expanded layouts
- Side panels
- Maximum data density

---

## 🎨 Theme System Flow

```mermaid
stateDiagram-v2
    [*] --> CheckPreference
    
    CheckPreference --> SystemDark : No Saved Preference + System Dark
    CheckPreference --> SystemLight : No Saved Preference + System Light
    CheckPreference --> SavedDark : Saved Dark
    CheckPreference --> SavedLight : Saved Light
    
    SystemDark --> Dark
    SystemLight --> Light
    SavedDark --> Dark
    SavedLight --> Light
    
    Dark --> Light : Toggle
    Light --> Dark : Toggle
    
    Dark --> SaveToDB : Save Preference
    Light --> SaveToDB : Save Preference
    
    SaveToDB --> [*]
```

---

## 🔌 API Integration Patterns

### Polygon.io Rate Limiting

```mermaid
graph TD
    Request[API Request] --> Queue[Request Queue]
    Queue --> RateLimiter{Rate Limit Check}
    
    RateLimiter -->|Under Limit| Execute[Execute Request]
    RateLimiter -->|At Limit| Wait[Wait for Window]
    
    Wait --> RateLimiter
    Execute --> Cache[Update Cache]
    Cache --> Response[Return Response]
    
    Response --> Monitor[Monitor Calls/Min]
    Monitor --> RateLimiter
    
    style Wait fill:#ef4444
    style Execute fill:#10b981
```

**Rate Limit:** 5 calls/minute (free tier)

**Strategies:**
1. Aggressive caching - 60s staleTime
2. Batch requests when possible
3. Request queue with rate limiter
4. Fallback to cached data
5. Mock data in development

---

## 🔒 Security Layers

```mermaid
graph TB
    User[User Request] --> HTTPS[HTTPS/TLS]
    HTTPS --> Auth{Authenticated?}
    
    Auth -->|No| Redirect[Redirect to Login]
    Auth -->|Yes| RLS{RLS Check}
    
    RLS -->|Denied| Error403[403 Forbidden]
    RLS -->|Allowed| Validate[Input Validation]
    
    Validate -->|Invalid| Error400[400 Bad Request]
    Validate -->|Valid| Process[Process Request]
    
    Process --> Response[Return Response]
    
    style Auth fill:#3b82f6
    style RLS fill:#10b981
    style Validate fill:#f59e0b
```

**Security Layers:**
1. HTTPS - Encrypted transport
2. Authentication - Supabase JWT
3. Row Level Security - PostgreSQL RLS
4. Input Validation - Zod schemas
5. API Key Security - Environment variables

---

## 📊 Performance Optimization Flow

```mermaid
graph LR
    Bundle[Initial Bundle] --> Split[Code Split by Route]
    Split --> Lazy[Lazy Load Routes]
    Lazy --> Tree[Tree Shake]
    Tree --> Minify[Minify + Compress]
    
    Minify --> Cache1[Browser Cache]
    Cache1 --> Cache2[CDN Cache]
    Cache2 --> User[Fast Load]
    
    style User fill:#10b981
```

**Optimization Techniques:**
- Code splitting by route
- Lazy loading components
- Tree shaking unused code
- Minification and compression
- Image optimization
- Font subsetting
- Preloading critical resources

**Target Metrics:**
- FCP < 1.5s
- TTI < 3.5s
- Bundle < 150KB
- Lighthouse > 90

---

## 🧪 Error Handling Strategy

```mermaid
graph TD
    Error[Error Occurs] --> Type{Error Type}
    
    Type -->|Network| Retry[Retry Logic]
    Type -->|Auth| Logout[Force Logout]
    Type -->|Validation| Show[Show Form Error]
    Type -->|Server| Boundary[Error Boundary]
    
    Retry --> Success{Success?}
    Success -->|Yes| Continue[Continue]
    Success -->|No| Toast[Show Toast]
    
    Logout --> Login[Redirect to Login]
    Show --> User[User Corrects]
    Boundary --> Fallback[Fallback UI]
    Toast --> Log[Log Error]
    
    style Continue fill:#10b981
    style Toast fill:#f59e0b
    style Fallback fill:#ef4444
```

---

## 🔮 Future Architecture Extensions

```mermaid
graph TB
    Current[Current MVP] --> Phase2[Phase 2]
    
    Phase2 --> Realtime[Real-time Alerts]
    Phase2 --> Multi[Multiple Portfolios]
    Phase2 --> Advanced[Advanced Charts]
    
    Phase2 --> Phase3[Phase 3]
    
    Phase3 --> AI[AI Insights]
    Phase3 --> Social[Social Features]
    Phase3 --> Mobile[Mobile Apps]
    
    Phase3 --> Phase4[Phase 4]
    
    Phase4 --> Trading[Trading Integration]
    Phase4 --> Premium[Premium Features]
    Phase4 --> API[Developer API]
    
    style Current fill:#3b82f6
    style Phase2 fill:#10b981
    style Phase3 fill:#f59e0b
    style Phase4 fill:#8b5cf6
```

---

**Last Updated:** 2026-04-08  
**Status:** Architecture diagrams complete
