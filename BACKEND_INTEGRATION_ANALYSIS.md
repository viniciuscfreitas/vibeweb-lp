# Backend Integration Analysis

## Current State Summary

### What's Mocked/Hardcoded:

1. **Authentication** (`js/auth.js`)
   - Hardcoded credentials: `vinicius@example.com` / `admin123`
   - User data stored in localStorage
   - No real auth validation

2. **Data Persistence** (`js/main.js`, `js/kanban.js`)
   - All data stored in `localStorage` under key `vibeTasks_Vanilla`
   - Default mock tasks initialized in `js/main.js` (lines 3-9)
   - No API calls exist - zero `fetch`, `axios`, or `XMLHttpRequest` usage

3. **Data Flow**:
   - `AppState.setTasks()` → updates in-memory state
   - `saveData()` → saves to localStorage
   - `initApp()` → loads from localStorage or uses `defaultTasks`

---

## Data Model

### Task/Project Structure

```javascript
{
  id: number,                    // Timestamp-based (Date.now())
  client: string,                // Required
  contact: string,               // Optional
  type: string,                  // "Landing Essencial" | "Autoridade de Marca" | "Aplicação Web" | "Manutenção"
  stack: string,                 // Optional (e.g., "React, Node...")
  domain: string,                // Optional (URL or domain)
  description: string,           // Optional
  price: number,                 // Required, EUR
  paymentStatus: string,         // "Pendente" | "50% Após Aprovação" | "Pago 100%"
  deadline: string,              // "48h" | "24h" | "Hoje" | "A Definir" | etc.
  deadlineTimestamp: number | null,  // Unix timestamp (ms) when deadline was set
  hosting: string,               // "nao" | "sim" | "depois"
  colId: number,                 // 0=Descoberta, 1=Acordo, 2=Construir, 3=Suporte/Live
  order: number                  // Sort order within column
}
```

### User Structure (Current)

```javascript
{
  name: string,                  // "Vinícius Freitas"
  email: string                  // "vinicius@example.com"
}
```

---

## What Needs to Be Done

### Phase 1: Extract Data Layer (Preparation)

**Priority: HIGH** - Must be done before backend work

1. **Create API Service Module** (`js/api.js`)
   - Centralize all HTTP calls
   - Handle errors consistently
   - Manage authentication tokens
   - Provide fallback/retry logic

2. **Refactor State Management**
   - Keep `AppState` for in-memory state
   - Replace `saveData()` with API calls
   - Replace localStorage loading with API fetching
   - Add loading/error states

3. **Extract Authentication Logic**
   - Move hardcoded login to API call
   - Implement token storage/refresh
   - Add logout API call (if needed)

### Phase 2: Define API Contract

**Required Endpoints:**

```
Authentication:
  POST   /api/auth/login         { email, password } → { user, token }
  POST   /api/auth/logout        (requires auth)
  GET    /api/auth/me            (requires auth) → { user }

Tasks/Projects:
  GET    /api/tasks              (requires auth) → Task[]
  GET    /api/tasks/:id          (requires auth) → Task
  POST   /api/tasks              (requires auth) { task data } → Task
  PUT    /api/tasks/:id          (requires auth) { task data } → Task
  DELETE /api/tasks/:id          (requires auth) → { success }
  PATCH  /api/tasks/:id/move     (requires auth) { colId, order } → Task
```

**Response Format (Recommended):**
```javascript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### Phase 3: Backend Requirements

**Database Schema Needed:**

```sql
-- Users table
users (
  id, email, name, password_hash, created_at, updated_at
)

-- Tasks/Projects table
tasks (
  id, user_id, client, contact, type, stack, domain, 
  description, price, payment_status, deadline, 
  deadline_timestamp, hosting, col_id, order_position,
  created_at, updated_at
)
```

**Backend Features:**
1. JWT authentication
2. CRUD operations for tasks
3. User-scoped data (tasks belong to authenticated user)
4. Validation matching frontend rules:
   - Client name required
   - Price must be positive number
   - Domain format validation
   - Contact format validation (email or @username)

---

## Files to Create/Modify

### New Files:
- `js/api.js` - API service layer
- `js/api-config.js` - API base URL, endpoints constants

### Files to Modify:

**`js/main.js`:**
- Remove `defaultTasks` hardcoded data
- Replace localStorage loading with API fetch
- Handle loading states during initial load
- Handle authentication errors (redirect to login)

**`js/auth.js`:**
- Replace hardcoded login check with API call
- Implement token management (store, refresh, clear)
- Add error handling for auth failures

**`js/kanban.js`:**
- `saveData()` → call API instead of localStorage
- `handleDrop()` → call API to update task position
- Add optimistic UI updates with rollback on error

**`js/forms.js`:**
- `saveForm()` → call API for create/update
- `deleteItem()` → call API for delete
- Add loading states during save

**`js/state.js`:**
- Add `isLoading` and `error` state flags
- Keep current structure (it's clean)

---

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. Create API service but keep localStorage as fallback
2. Feature flag to switch between localStorage and API
3. Migrate feature by feature (auth first, then tasks)

### Option 2: Big Bang
1. Build complete backend first
2. Switch frontend to API all at once
3. Higher risk, faster if backend is ready

---

## Implementation Priority

1. **CRITICAL:**
   - API service layer (`js/api.js`)
   - Authentication API integration
   - Task fetch on app init
   - Task create/update/delete

2. **HIGH:**
   - Task drag-and-drop position updates
   - Error handling and user feedback
   - Loading states

3. **MEDIUM:**
   - Token refresh mechanism
   - Offline detection (optional)
   - Optimistic updates with rollback

4. **LOW:**
   - Data migration tool (localStorage → backend)
   - Real-time updates (WebSockets - future)
   - Caching strategy

---

## Technical Considerations

### Error Handling
- Network errors (offline, timeout)
- Authentication errors (401, 403)
- Validation errors (400)
- Server errors (500+)
- User-friendly error messages

### Loading States
- Show spinners during API calls
- Disable actions during save operations
- Optimistic UI updates where safe

### Security
- Store JWT securely (httpOnly cookies preferred, or localStorage)
- Implement CSRF protection
- Validate all inputs on backend (don't trust frontend)
- Rate limiting on auth endpoints

### Performance
- Batch operations where possible (e.g., drag-and-drop)
- Cache data when appropriate
- Pagination for large datasets (future)

---

## Testing Checklist (Before Going Live)

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Create new task
- [ ] Edit existing task
- [ ] Delete task
- [ ] Move task between columns
- [ ] Reorder tasks within column
- [ ] Handle network errors gracefully
- [ ] Handle expired token (refresh or redirect)
- [ ] Data persists after page refresh
- [ ] Multiple users see only their own tasks
- [ ] All validations work (client, price, domain, contact)

---

## Notes

- Current codebase is well-structured and modular
- State management is clean (AppState pattern)
- No dependencies to add (vanilla JS - good for simplicity)
- Consider adding a lightweight HTTP library if fetch gets verbose (optional)

---

**Status:** Frontend is ready for backend integration. Main work is extracting localStorage calls and replacing with API service layer.