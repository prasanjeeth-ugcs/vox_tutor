# VoxTutor — Interview Questions & Answers

> **How to use this document**: Each section contains questions grouped by topic. Questions marked with 🔥 are high-probability — interviewers love asking these. Questions marked with 🧠 are deep cross-questions that test whether you truly understand vs. memorized. Answers are provided in collapsible blocks so you can quiz yourself first.

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [Session Management & Cookies](#2-session-management--cookies)
3. [Firebase — Client SDK vs Admin SDK](#3-firebase--client-sdk-vs-admin-sdk)
4. [React Architecture & State Management](#4-react-architecture--state-management)
5. [React Router & Route Protection](#5-react-router--route-protection)
6. [Vapi — Voice AI Integration](#6-vapi--voice-ai-integration)
7. [Google Gemini — AI / LLM Integration](#7-google-gemini--ai--llm-integration)
8. [MongoDB & Mongoose](#8-mongodb--mongoose)
9. [Express.js Backend & REST API Design](#9-expressjs-backend--rest-api-design)
10. [Real-Time Features & Transcript Saving](#10-real-time-features--transcript-saving)
11. [Frontend — Vite, Tailwind, Styling](#11-frontend--vite-tailwind-styling)
12. [System Design — Scalability & Performance](#12-system-design--scalability--performance)
13. [System Design — Concurrency & Race Conditions](#13-system-design--concurrency--race-conditions)
14. [System Design — Security & Attack Vectors](#14-system-design--security--attack-vectors)
15. [System Design — Reliability & Error Handling](#15-system-design--reliability--error-handling)
16. [System Design — Architecture & Trade-offs](#16-system-design--architecture--trade-offs)
17. [Database Design & Schema Questions](#17-database-design--schema-questions)
18. [Deployment, DevOps & Production Readiness](#18-deployment-devops--production-readiness)
19. [Code Quality & Best Practices](#19-code-quality--best-practices)
20. [Behavioral / "Why Did You..." Questions](#20-behavioral--why-did-you-questions)
21. [JavaScript & Node.js Core Concepts](#21-javascript--nodejs-core-concepts)
22. [HTTP, Networking & API Concepts](#22-http-networking--api-concepts)
23. [Testing Strategy](#23-testing-strategy)
24. [Advanced Design Patterns in the Codebase](#24-advanced-design-patterns-in-the-codebase)
25. ["What Would Happen If..." Scenarios](#25-what-would-happen-if-scenarios)
26. [Rapid-Fire — Explain in One Line](#26-rapid-fire--explain-in-one-line)
27. [Advanced Cross-Questions an Interviewer Might Chain](#27-advanced-cross-questions-an-interviewer-might-chain)
28. [Trick Questions & Common Misconceptions](#28-trick-questions--common-misconceptions)
29. [Final Boss — Multi-Part Scenario Questions](#29-final-boss--multi-part-scenario-questions)


---

## 1. Authentication & Security

### Q1. 🔥 Explain the complete authentication flow in your project — from the moment a user clicks "Sign Up" to when they land on the dashboard.

<details>
<summary>Answer</summary>

1. User fills name, email, password and clicks "Create Account"
2. `createUserWithEmailAndPassword(auth, email, password)` — Firebase Client SDK creates the user in Firebase Auth
3. `updateProfile(user, { displayName: name })` — Sets the display name in Firebase
4. `user.getIdToken()` — Obtains a short-lived Firebase ID token (JWT)
5. `POST /api/auth/session { idToken }` — Frontend sends the token to our backend
6. Backend calls `adminAuth().createSessionCookie(idToken, { expiresIn: 7 days })` — Firebase Admin SDK creates a long-lived session cookie
7. Backend sets the cookie as `httpOnly`, `sameSite: 'lax'`, `secure` (in production) on the HTTP response
8. `POST /api/auth/upsert-user { uid, name, email }` — Backend saves/updates the user profile in MongoDB using `findOneAndUpdate` with `upsert: true`
9. Frontend calls `login({ uid, name, email })` which updates the React AuthContext state
10. `navigate('/dashboard')` — React Router redirects to the protected dashboard route
</details>

---

### Q2. 🔥 Why did you choose Firebase Authentication over building your own auth system?

<details>
<summary>Answer</summary>

- **No password storage**: Firebase handles hashing (bcrypt internally), salting, and credential verification. Building this correctly is error-prone.
- **Google OAuth built-in**: Adding Google sign-in required just 3 lines of code (`GoogleAuthProvider` + `signInWithPopup`). Building OAuth from scratch requires registering as an OAuth app, handling callback URLs, exchanging authorization codes, etc.
- **Session cookie SDK**: Firebase Admin has native `createSessionCookie()` and `verifySessionCookie()` — I didn't need to build session management.
- **Battle-tested security**: Firebase handles brute-force protection, account enumeration prevention, and OWASP Top 10 mitigations.
- **Focus on core features**: Auth is a solved problem. My time was better spent on the voice interview and AI feedback features.
</details>

---

### Q3. Why do you have both `createUserWithEmailAndPassword` on the frontend AND `upsertUser` on the backend? Isn't the user already created in Firebase?

<details>
<summary>Answer</summary>

Firebase Auth and MongoDB serve different purposes:

- **Firebase Auth** stores authentication credentials (email, hashed password, OAuth tokens). It's an identity provider.
- **MongoDB** stores our application's user profile (uid, name, email, photoURL) alongside our business data (interviews, feedback).

We need the user in MongoDB because:
1. The `requireAuth` middleware looks up the user by UID in MongoDB to attach `req.user` to the request
2. The dashboard queries interviews by `userId` — which references the MongoDB user
3. Feedback documents store `userId` — again referencing MongoDB
4. If we only used Firebase Auth, every protected route would need a Firebase Admin call instead of a simple MongoDB lookup

The `upsert` pattern handles both new sign-ups and returning Google sign-ins with one endpoint.
</details>

---

### Q4. 🧠 What happens if the `upsertUser` call fails after the session cookie is already created? The user has a valid session but no MongoDB record.

<details>
<summary>Answer</summary>

This is a legitimate edge case. Here's what would happen:

1. User gets the session cookie → redirected to dashboard
2. Dashboard calls `GET /api/interviews` → `requireAuth` middleware runs
3. Middleware verifies the cookie → gets the UID → calls `User.findOne({ uid })`
4. Returns `null` because the MongoDB record was never created
5. Middleware returns `401 { error: 'User not found' }`
6. Frontend shows the user as not authenticated

**How to fix this in production**:
- Wrap steps 5-8 of the auth flow (session creation + user upsert) in a single backend endpoint that does both atomically
- Or add a retry mechanism on the frontend — if `upsertUser` fails, retry 2-3 times before giving up
- Or in the `getCurrentUser` endpoint, create the user record on-the-fly if the cookie is valid but the MongoDB record is missing
</details>

---

### Q5. 🧠 Your `upsertUser` endpoint has no authentication middleware. Couldn't anyone call `POST /api/auth/upsert-user` with a fake UID and create a user?

<details>
<summary>Answer</summary>

Yes, technically someone could call this endpoint directly. However:

1. Creating a fake user in MongoDB is harmless — they can't create a valid session cookie without a real Firebase ID token
2. The `requireAuth` middleware verifies the session cookie with Firebase Admin before allowing access to any protected route
3. A fake MongoDB user with a UID that doesn't exist in Firebase would never pass the `verifySessionCookie` check

**But in production, I would fix this by**:
- Adding the session cookie check to the `upsertUser` endpoint
- Or extracting the UID from the session cookie server-side instead of accepting it from the request body
- This follows the principle of "never trust the client"
</details>

---

### Q6. How does Google Sign-In work differently from email/password sign-in in your implementation?

<details>
<summary>Answer</summary>

The only difference is **how the Firebase ID token is obtained**:

| Step | Email/Password | Google |
|------|---------------|--------|
| 1. Trigger | `signInWithEmailAndPassword(auth, email, password)` | `signInWithPopup(auth, new GoogleAuthProvider())` |
| 2. What happens | Firebase verifies email + password hash | Opens Google OAuth popup → user approves → Firebase gets Google OAuth token |
| 3. Result | `UserCredential` object | Same `UserCredential` object |
| 4. After this | `user.getIdToken()` → same `onAuthSuccess()` flow | Identical |

After obtaining the `UserCredential`, both paths call the same `onAuthSuccess()` function which creates the session cookie and upserts the user. The difference is that Google sign-in also provides a `photoURL` from the Google profile.
</details>

---

### Q7. What is an ID token? How is it different from the session cookie?

<details>
<summary>Answer</summary>

| Aspect | Firebase ID Token | Session Cookie |
|--------|------------------|----------------|
| **Lifetime** | ~1 hour (short-lived) | 7 days (long-lived) |
| **Created by** | Firebase Client SDK (in the browser) | Firebase Admin SDK (on the server) |
| **Format** | JWT (base64-encoded JSON) | Opaque string (Firebase-managed) |
| **Storage** | In-memory on the frontend (never persisted) | HTTP-only cookie (browser manages it) |
| **Purpose** | Prove to the backend that the user just authenticated | Maintain a long-lived server-side session |
| **JavaScript access** | Accessible to frontend code | NOT accessible to JavaScript (httpOnly) |

The ID token is exchanged for a session cookie once, then discarded. All subsequent requests use the cookie.
</details>

---

## 2. Session Management & Cookies

### Q8. 🔥 Why did you use HTTP-only session cookies instead of storing JWT tokens in localStorage?

<details>
<summary>Answer</summary>

| Concern | HTTP-only Cookie | JWT in localStorage |
|---------|-----------------|-------------------|
| **XSS Attack** | ✅ Safe — JavaScript cannot read HTTP-only cookies | ❌ Vulnerable — any XSS attack can steal the token |
| **Token Refresh** | Not needed — cookie auto-expires and is auto-sent | Must implement refresh token rotation |
| **CSRF** | Mitigated with `sameSite: 'lax'` | N/A (no cookie) |
| **Implementation** | Simpler — browser handles cookie lifecycle | Must manually add `Authorization: Bearer <token>` to every request |

An XSS vulnerability (e.g., injected `<script>` tag) can read everything in localStorage and send it to an attacker's server. An HTTP-only cookie cannot be read by JavaScript at all — so even if XSS occurs, the session cookie is safe.
</details>

---

### Q9. Explain what `sameSite: 'lax'` does and why you chose it over `'strict'` or `'none'`.

<details>
<summary>Answer</summary>

`sameSite` controls when the browser sends the cookie with cross-site requests:

| Value | Behavior |
|-------|----------|
| `strict` | Cookie is **never** sent on cross-site requests (even following a link from Google to our site wouldn't send the cookie) |
| `lax` | Cookie is sent on **top-level navigations** (clicking a link) but NOT on cross-site POST/iframe/fetch requests |
| `none` | Cookie is always sent (requires `secure: true` — HTTPS only) |

I chose `lax` because:
- `strict` would break the flow if a user clicks a link to VoxTutor from their email — they'd appear logged out
- `none` would expose the cookie to CSRF attacks from any site
- `lax` is the sweet spot: protects against CSRF while still working when users navigate from external links
</details>

---

### Q10. 🧠 What would happen if a user changes their password on another device? Does the session cookie on this device get invalidated?

<details>
<summary>Answer</summary>

Yes, because of the second parameter in `verifySessionCookie(cookie, true)`:

- `true` tells Firebase Admin to check whether the user's session tokens have been **revoked**
- When a user changes their password, Firebase automatically revokes all existing sessions
- The next API request from the old device would fail verification in the `requireAuth` middleware → returns 401
- The frontend would see the user as not authenticated and redirect to sign-in

Without the `true` flag, the old cookie would remain valid until it naturally expires (7 days), which is a security risk.
</details>

---

### Q11. 🧠 How does the cookie get sent from the frontend to the backend if they're on different ports (5173 vs 5000)?

<details>
<summary>Answer</summary>

Two mechanisms work together:

1. **Vite's dev proxy** (`vite.config.js`):
   ```javascript
   server: {
     proxy: {
       '/api': { target: 'http://localhost:5000', changeOrigin: true }
     }
   }
   ```
   All requests to `/api/*` from the browser (port 5173) are **proxied** through Vite's dev server to Express (port 5000). From the browser's perspective, the request goes to `localhost:5173/api/...` — same origin — so the cookie is sent normally.

2. **CORS with credentials** (backend `index.js`):
   ```javascript
   app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
   ```
   If the proxy weren't in place, this CORS config would allow cross-origin requests with cookies.

3. **`credentials: 'include'`** (frontend `api.js`):
   Tells `fetch()` to include cookies even on cross-origin requests.

In production, both would typically be served from the same domain, eliminating the cross-origin issue entirely.
</details>

---

## 3. Firebase — Client SDK vs Admin SDK

### Q12. 🔥 You use Firebase on both frontend and backend. What's the difference between the Client SDK and the Admin SDK?

<details>
<summary>Answer</summary>

| Aspect | Client SDK (Frontend) | Admin SDK (Backend) |
|--------|----------------------|-------------------|
| **Package** | `firebase` | `firebase-admin` |
| **Runs in** | Browser | Node.js server |
| **Auth method** | Public API key (safe to expose) | Private service account key (must be secret) |
| **Purpose** | Sign users in (email, Google) | Verify tokens, create/revoke sessions |
| **Security model** | Security Rules enforce access | Full administrative access (bypasses rules) |
| **Key operations** | `createUserWithEmailAndPassword`, `signInWithPopup`, `getIdToken` | `verifyIdToken`, `createSessionCookie`, `verifySessionCookie` |
| **Initialization** | `initializeApp(firebaseConfig)` | `initializeApp({ credential: cert(serviceAccount) })` |

The Client SDK is for user-facing operations. The Admin SDK has elevated privileges — it can verify tokens, manage users, and bypass security rules. That's why the Admin credentials (private key) must never be exposed to the client.
</details>

---

### Q13. 🧠 Why do you check `getApps().find(app => app.name === 'admin')` before initializing the Admin SDK?

<details>
<summary>Answer</summary>

Firebase throws a `duplicate-app` error if you try to initialize an app with the same name twice. In Node.js with ES modules, there are scenarios where the `firebase.js` config file might be imported multiple times (e.g., by different controllers). The check ensures we only initialize once and reuse the existing app instance.

The app is named `'admin'` to distinguish it from any potential client-side Firebase app (which uses the default name). This is a defensive coding pattern — "initialize once, reuse everywhere."
</details>

---

### Q14. Why is `adminAuth` a function `() => getAuth(getAdminApp())` instead of a constant `const adminAuth = getAuth(app)`?

<details>
<summary>Answer</summary>

Lazy initialization. If it were a constant:
```javascript
export const adminAuth = getAuth(getAdminApp()); // Runs immediately on import
```
Firebase would initialize the moment any file imports this module — even if that particular code path doesn't need auth. As a function:
```javascript
export const adminAuth = () => getAuth(getAdminApp()); // Runs only when called
```
Firebase only initializes when the first API request actually needs to verify a cookie. This:
- Prevents initialization errors from blocking server startup
- Makes the module safe to import in tests without needing Firebase credentials
- Follows the principle of lazy evaluation
</details>

---

## 4. React Architecture & State Management

### Q15. 🔥 How do you manage global authentication state across all components?

<details>
<summary>Answer</summary>

Using **React Context API** with the `useAuth` hook:

1. `AuthProvider` wraps the entire app (in `main.jsx`):
   ```jsx
   <BrowserRouter>
     <AuthProvider>
       <App />
     </AuthProvider>
   </BrowserRouter>
   ```

2. `AuthProvider` maintains state: `{ user, loading, login, logout }`

3. On mount, it calls `GET /api/auth/me` to check if there's a valid session cookie. If yes, the user is restored from the backend.

4. Any component can read auth state via `useAuth()`:
   ```javascript
   const { user, loading, logout } = useAuth();
   ```

5. Route guards (RootLayout) use `useAuth()` to redirect unauthenticated users.

I didn't use Redux or Zustand because:
- Auth state is the only truly global state in this app
- Interview data and feedback are page-local (fetched on mount, not shared)
- Context API is sufficient for simple global state without the overhead of external state management
</details>

---

### Q16. 🧠 Why didn't you use Redux or Zustand for state management?

<details>
<summary>Answer</summary>

The app only has one piece of truly global state: the authenticated user. Everything else is page-local:

| Data | Scope | Where it lives |
|------|-------|----------------|
| User session | Global | AuthContext |
| Interview list | DashboardPage only | `useState` in DashboardPage |
| Interview data | InterviewPage only | `useState` in InterviewPage |
| Transcript | InterviewPageClient only | `useState` + `useRef` |
| Feedback | FeedbackPage only | `useState` in FeedbackPage |

Redux/Zustand would add complexity (actions, reducers, selectors, devtools) without solving a real problem. Context API handles the single global concern cleanly. If the app grew to need shared state across many components (e.g., notifications, user preferences, real-time updates), I'd introduce Zustand (simpler API than Redux).
</details>

---

### Q17. 🔥 Explain the stale closure problem you encountered in the interview component and how you solved it.

<details>
<summary>Answer</summary>

**The problem**: `handleEndInterview` is created inside `useCallback` and registered in event handlers during the initial `useEffect([], [])`. At that point, the `transcript` state is `[]`. Even as new transcript entries are added and `transcript` state updates, the copy inside `handleEndInterview`'s closure remains `[]` — this is a "stale closure."

**The solution**: Use `useRef` as a parallel store:
```javascript
const transcriptRef = useRef([]);

const addEntry = useCallback((role, content) => {
  const newEntry = { role, content, timestamp: new Date().toISOString() };
  transcriptRef.current = [...transcriptRef.current, newEntry]; // Ref always has latest
  setTranscript([...transcriptRef.current]); // State triggers re-render
}, []);

const handleEndInterview = useCallback(async () => {
  const finalTranscript = transcriptRef.current; // Always current, never stale
  // ... send to API
}, []);
```

Refs don't get captured in closures because `ref.current` is a mutable property on a persistent object. The closure captures the ref object (which never changes), and reads `.current` at call time (which always has the latest value).
</details>

---

### Q18. What is the purpose of the `isMounted` flag in the Vapi initialization?

<details>
<summary>Answer</summary>

```javascript
useEffect(() => {
  let isMounted = true;
  startVapiCall(isMounted);
  return () => { isMounted = false; };
}, []);
```

If the user navigates away from the interview page while Vapi is still connecting (async operation), the component unmounts but the async callbacks would still try to call `setStatus`, `setIsSpeaking`, etc. React warns about this: "Can't perform a React state update on an unmounted component."

The `isMounted` flag is checked before every state update:
```javascript
vapiInstance.on('call-start', () => {
  if (!isMounted) return; // Don't update state if component is gone
  setStatus('live');
});
```

This prevents memory leaks and React warnings. It's a standard pattern for async operations in `useEffect`.
</details>

---

### Q19. 🧠 Why do you use `useCallback` for `addEntry` and `handleEndInterview`?

<details>
<summary>Answer</summary>

1. **`addEntry`**: It's passed as a dependency indirectly — it's called inside the Vapi `message` event handler. Without `useCallback`, a new function would be created on every render, but since the event handler is registered once (in the mount effect), the function reference is already captured. The real benefit here is clarity and avoiding accidental re-registrations if the effect ever re-runs.

2. **`handleEndInterview`**: It's referenced in the countdown timer's `setInterval` and in Vapi's `call-end` event handler. `useCallback` ensures the function identity is stable across renders, so these callbacks always reference the same function.

More importantly, both functions close over `interviewId`, `userId`, etc. — `useCallback` with the dependency array ensures they're only recreated when these values actually change (which they don't after mount, since they come from props).
</details>

---

### Q20. Your `DashboardPage` fetches data in `useEffect`. Why not use a data fetching library like React Query or SWR?

<details>
<summary>Answer</summary>

For this project's scope, `useEffect` + `useState` is sufficient because:

1. **No cache invalidation needed** — the dashboard is only viewed by one user at a time, and data changes only when they complete an interview (after which they navigate to the feedback page and back)
2. **No background refetching** — interviews don't change in the background (no real-time updates from other users)
3. **No optimistic updates** — we don't need to show data before it's confirmed by the server

However, React Query/SWR would improve the experience by adding:
- Automatic cache + stale-while-revalidate (faster page revisits)
- Loading/error states as first-class API (less boilerplate)
- Deduplication of concurrent requests
- Automatic refetch on window focus

I'd introduce React Query if the app grew to have more complex data fetching patterns (pagination, infinite scroll, real-time updates).
</details>

---

## 5. React Router & Route Protection

### Q21. 🔥 How do you protect routes so only authenticated users can access the dashboard?

<details>
<summary>Answer</summary>

Using React Router v6's **layout route** pattern:

```jsx
<Route element={<RootLayout />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/interview/:id" element={<InterviewPage />} />
</Route>
```

`RootLayout` acts as a guard:
1. Reads `{ user, loading }` from `useAuth()`
2. If `loading` → shows a spinner (session check in progress)
3. If `!user` → renders `<Navigate to="/sign-in" replace />` (redirect)
4. If `user` → renders `<Navbar />` + `<Outlet />` (the matched child route)

`<Outlet />` is React Router's slot for rendering child routes inside a layout. This means the auth check happens once at the layout level, not in every individual page component.
</details>

---

### Q22. What does the `replace` prop do in `<Navigate to="/sign-in" replace />`?

<details>
<summary>Answer</summary>

`replace` replaces the current entry in the browser's history stack instead of pushing a new one.

Without `replace`:
- User visits `/dashboard` → redirected to `/sign-in` → history has both entries
- After signing in, if they hit the browser back button, they'd go back to `/dashboard` → which redirects to `/sign-in` again → infinite loop

With `replace`:
- `/dashboard` is **replaced** by `/sign-in` in history
- Back button goes to wherever the user was before `/dashboard` (e.g., the landing page)
</details>

---

### Q23. 🧠 What's the difference between `AuthLayout` and `RootLayout`? Why two layouts?

<details>
<summary>Answer</summary>

| Aspect | AuthLayout | RootLayout |
|--------|-----------|-----------|
| **For pages** | `/sign-in`, `/sign-up` | `/dashboard`, `/interview/*` |
| **Navbar** | Minimal (logo + theme toggle only) | Full (logo, dashboard link, user avatar, sign out) |
| **Auth guard** | None (anyone can access) | Yes — redirects to `/sign-in` if not authenticated |
| **Purpose** | Visually clean login experience | Protected app shell |

Two layouts because the sign-in page and the dashboard have fundamentally different UI requirements. Combining them would mean conditional rendering of the Navbar, which is messier than separate layouts.
</details>

---

## 6. Vapi — Voice AI Integration

### Q24. 🔥 How does the real-time voice interview work technically?

<details>
<summary>Answer</summary>

1. **Vapi SDK** (`@vapi-ai/web`) establishes a **WebRTC** connection to Vapi's cloud servers
2. The user's microphone audio is streamed to Vapi in real-time
3. Vapi uses **Speech-to-Text** (STT) to transcribe the user's speech
4. The transcription is sent to an **LLM** (GPT-4o-mini, configured via Vapi's assistant) along with the system prompt
5. The LLM generates a response based on the conversation history and the system prompt (which contains the interview questions)
6. Vapi uses **Text-to-Speech** (TTS) to convert the LLM's response to audio
7. The synthesized audio is streamed back to the user's browser via WebRTC
8. Meanwhile, Vapi emits events (`speech-start`, `speech-end`, `message`, `volume-level`) that my frontend listens to for UI updates

So the data flow is:
```
User's mic → WebRTC → Vapi Cloud → STT → LLM (GPT-4o-mini) → TTS → WebRTC → User's speaker
                                                                    ↓
                                                            Transcript events
                                                                    ↓
                                                            My frontend UI
```
</details>

---

### Q25. Why did you use dynamic import for the Vapi SDK?

<details>
<summary>Answer</summary>

```javascript
const { default: Vapi } = await import('@vapi-ai/web');
```

**Code splitting**: The Vapi SDK is ~50KB of JavaScript. Without dynamic import, it would be bundled into the main app bundle and loaded on every page — even the landing page, sign-in page, and dashboard where voice is never used.

With dynamic import:
- Vite creates a separate chunk for the Vapi SDK
- It's only downloaded when the user enters the interview page
- The main bundle is smaller → faster initial page load
- If the import fails (network issue), we catch the error and show a message instead of crashing the entire app
</details>

---

### Q26. 🧠 What happens if the user closes the browser tab during an interview?

<details>
<summary>Answer</summary>

1. The React component unmounts → `isMounted` is set to `false`
2. The WebRTC connection is terminated by the browser (WebRTC auto-closes on tab close)
3. Vapi detects the disconnection on their end and ends the session
4. The interview remains in `status: 'active'` in MongoDB (it was never properly ended)
5. The transcript entries that were already saved via `POST /api/transcript` are preserved

**What happens on their next visit**:
- If they navigate to `/interview/:id`, `InterviewPage` loads the interview
- Since `status !== 'completed'` and questions exist, it would try to start a new Vapi call
- But the transcript already has entries, which could cause confusion

**How to fix in production**:
- Add a `beforeunload` event listener to warn the user before leaving
- Set a timeout on the backend — if no transcript entry is received for 5 minutes, auto-complete the interview with whatever transcript exists
- Or add a "Resume Interview" feature that continues from where the user left off
</details>

---

### Q27. 🧠 How do you prevent `handleEndInterview` from running twice?

<details>
<summary>Answer</summary>

Using a **ref-based guard**:
```javascript
const endingRef = useRef(false);

const handleEndInterview = useCallback(async () => {
  if (endingRef.current) return;  // Already ending — skip
  endingRef.current = true;
  // ... rest of the end logic
}, []);
```

This is necessary because two things can trigger the end simultaneously:
1. The countdown timer reaching 0
2. Vapi's `call-end` event firing (when the AI says "That concludes our interview")

Without the guard, the feedback API would be called twice, creating duplicate feedback records.

**Why a ref instead of state?**
- `useState` would work but causes a re-render (unnecessary)
- `useRef` is synchronous — the moment the first caller sets it to `true`, the second caller immediately sees it
- State updates are batched and asynchronous — there's a tiny window where both callers could read `false`
</details>

---

### Q28. What events does Vapi emit, and how do you use them for UI feedback?

<details>
<summary>Answer</summary>

| Event | UI Effect |
|-------|-----------|
| `call-start` | Status → 'live', countdown timer starts, isListening = true |
| `call-end` | Triggers `handleEndInterview()` |
| `speech-start` | AI avatar border turns brand color, status text says "Speaking...", waveform animates |
| `speech-end` | Avatar border turns green, status text says "Listening...", waveform changes |
| `volume-level` | Updates mic volume level (0–1) for visual waveform bars |
| `message` (type=transcript, transcriptType=final) | Adds a new entry to the transcript panel, saves to backend |
| `error` | Shows error banner ("Voice connection error") or triggers end if "Meeting has ended" |

The key distinction is `transcriptType: 'final'` vs. partial — I only process final transcripts to avoid showing incomplete words.
</details>

---

## 7. Google Gemini — AI / LLM Integration

### Q29. 🔥 How does your AI question generation work? Walk me through the prompt engineering.

<details>
<summary>Answer</summary>

The prompt has four key components:

1. **Role assignment**: "You are an expert {domain} interviewer at a top firm" — gives the LLM a persona
2. **Target calibration**: Maps difficulty to experience level ("a mid-level professional with 2–5 years of experience")
3. **Topic scoping**: "Key topics to cover: System Design, Data Structures, ..." — constrains questions to relevant areas
4. **Output constraints**:
   - "Progressively deeper" — easy questions first, hard questions last
   - "Standalone and clear when spoken aloud" — because they'll be read by TTS
   - "Mix conceptual, behavioral, and situational" — variety
   - "Do NOT number the questions" — numbering is added in the system prompt separately
   - "Return a JSON array of strings" — structured output

The critical technical detail is `responseMimeType: 'application/json'` which forces Gemini to return **only valid JSON** — no markdown, no commentary, no wrapping. This makes `JSON.parse()` reliable without regex extraction.
</details>

---

### Q30. 🧠 What if Gemini returns malformed JSON despite `responseMimeType: 'application/json'`?

<details>
<summary>Answer</summary>

It's extremely rare with `responseMimeType` set, but possible if:
- The model generates a response that exceeds its token limit (truncated JSON)
- The API has an unexpected error

Current behavior: `JSON.parse()` throws → the catch block returns `500 { error: 'Failed to generate questions' }` → the frontend shows the error to the user.

**Production improvements**:
- Add a retry with exponential backoff (1s, 2s, 4s) before returning an error
- Validate the parsed JSON against the expected schema (ensure it's an array of strings, correct length)
- Add a fallback set of generic questions per domain in case AI generation consistently fails
- Log the raw response for debugging
</details>

---

### Q31. 🔥 How does the AI feedback analysis work? How do you ensure consistent structured output?

<details>
<summary>Answer</summary>

1. **Transcript formatting**: The transcript array is converted to readable text:
   ```
   Interviewer: Tell me about your experience...
   Candidate: I've worked on microservices architecture where...
   ```

2. **Structured prompt**: The prompt includes the exact JSON schema the AI must follow, with specific field names, types, and constraints (score ranges, enum values for verdict/rating)

3. **JSON mode**: `responseMimeType: 'application/json'` forces structured output

4. **Direct spread**: The parsed JSON is spread into the Mongoose model:
   ```javascript
   const analysis = JSON.parse(result.text);
   await Feedback.create({ interviewId, userId, ...analysis });
   ```
   Mongoose's schema validation catches any missing or invalid fields.

The prompt specifies exactly 4 category names, exactly 3 strengths/improvements/nextSteps — ensuring consistent output that the frontend can render without null checks.
</details>

---

### Q32. Why did you use Gemini 2.5 Flash specifically? Why not GPT-4 or Claude?

<details>
<summary>Answer</summary>

- **Speed**: Gemini Flash is optimized for low-latency responses — important for question generation which happens while the user waits
- **Native JSON mode**: `responseMimeType: 'application/json'` is a first-party feature, more reliable than prompt-based JSON extraction
- **Single billing**: One API key for both question generation and feedback analysis, simplifying credential management
- **Cost**: Flash models are significantly cheaper than frontier models, suitable for a project that generates content on every interview
- **Sufficient quality**: Interview questions and feedback don't require the reasoning depth of GPT-4o or Claude Opus — Flash's quality is more than adequate for this use case
</details>

---

### Q33. 🧠 The feedback prompt sends the entire transcript to Gemini. What if the transcript is very long (30-minute interview)?

<details>
<summary>Answer</summary>

Gemini 2.5 Flash supports a **1 million token context window**, so a 30-minute interview transcript (roughly 3,000–5,000 words ≈ 4,000–6,500 tokens) is well within limits.

However, if this were a concern:
- **Truncation**: Send only the last N entries of the transcript
- **Summarization pipeline**: First pass to summarize key points, second pass to generate feedback from the summary
- **Chunking**: Split the transcript by question and analyze each section separately, then aggregate scores
- **Token counting**: Use a tokenizer to count tokens before sending, and switch to a summarization approach if the limit is exceeded
</details>

---

## 8. MongoDB & Mongoose

### Q34. 🔥 Why did you choose MongoDB over a relational database like PostgreSQL?

<details>
<summary>Answer</summary>

1. **Flexible nested data**: Interview transcripts are arrays of `{role, content, timestamp}` objects. In MongoDB, this is a native array field. In PostgreSQL, I'd need a separate `transcript_entries` table with a foreign key, making writes (during the live interview) more complex.

2. **Schema evolution**: During development, I added and removed fields frequently. MongoDB's schemaless nature (with Mongoose for validation) made this frictionless.

3. **Atomic array operations**: `$push` to append transcript entries is a single atomic operation. In PostgreSQL, I'd need an INSERT into a related table.

4. **Natural JSON fit**: The Gemini AI returns JSON responses that are spread directly into the Feedback document. No ORM mapping needed.

5. **Document model matches the app**: Each interview is a self-contained document with all its data. No JOINs needed.
</details>

---

### Q35. 🔥 Explain the `$push` operator and why you used it for transcript saving.

<details>
<summary>Answer</summary>

```javascript
await Interview.findByIdAndUpdate(interviewId, {
  $push: { transcript: entry },
  $set: { status: 'active' },
});
```

`$push` is a MongoDB update operator that **appends** an element to an array field. It's better than alternatives because:

| Approach | Problem |
|----------|---------|
| Read → modify → write | Race condition — two concurrent pushes could overwrite each other |
| `$set: { transcript: [...old, newEntry] }` | Requires reading the old array first, and the full array is sent over the network |
| `$push: { transcript: entry }` | ✅ Atomic, server-side append. Only sends the new entry. No read needed. |

This is critical during a live interview where transcript entries arrive every few seconds. `$push` guarantees no data is lost even if two entries arrive simultaneously.
</details>

---

### Q36. What does `.lean()` do, and why do you use it on read queries?

<details>
<summary>Answer</summary>

Normally, Mongoose queries return **Mongoose Document** objects that have:
- Getters, setters, and virtual properties
- Change tracking (for `.save()`)
- Instance methods
- The `__v` version key

`.lean()` returns **plain JavaScript objects** instead. This is 2–5x faster and uses less memory because:
- No Mongoose overhead (no change tracking, no getters)
- The result is a simple POJO (Plain Old JavaScript Object)

I use it on all read-only queries (dashboard data, feedback display) where I just need to serialize the data to JSON. The only time you'd skip `.lean()` is when you need to call `.save()` or use Mongoose methods on the returned document.
</details>

---

### Q37. 🧠 Why is `_id: false` set on the `transcriptEntrySchema` and `categorySchema`?

<details>
<summary>Answer</summary>

By default, Mongoose adds an `_id` field (ObjectId) to every subdocument in an array. For transcript entries and feedback categories:

- They're **embedded subdocuments**, not standalone entities
- They're never queried or referenced individually — always accessed through their parent
- Adding `_id` to each would waste storage (~12 bytes per entry × potentially hundreds of entries)
- It would also clutter the API response with unnecessary IDs

`_id: false` tells Mongoose: "these are just data objects, not documents — don't give them IDs."
</details>

---

### Q38. Why did you index `userId` on the Interview and Feedback models?

<details>
<summary>Answer</summary>

```javascript
userId: { type: String, required: true, index: true }
```

Without an index, `Interview.find({ userId: 'abc123' })` would perform a **collection scan** — checking every document in the collection. With thousands of users, each with dozens of interviews, this becomes slow.

An index on `userId` creates a B-tree data structure that allows MongoDB to find all documents for a specific user in O(log n) time instead of O(n).

The dashboard calls `Interview.find({ userId }).sort({ createdAt: -1 })` — ideally, this should have a **compound index** on `{ userId: 1, createdAt: -1 }` for optimal query performance. The current single-field index on `userId` helps with filtering but MongoDB still needs to sort in-memory.
</details>

---

## 9. Express.js Backend & REST API Design

### Q39. 🔥 Walk me through how the Express server starts up and handles a request.

<details>
<summary>Answer</summary>

**Startup sequence** (`index.js`):
1. `import 'dotenv/config'` — loads `.env` file into `process.env`
2. Create Express app: `const app = express()`
3. Register middleware (in order):
   - `cors({ origin, credentials })` — allows frontend cross-origin requests
   - `cookieParser()` — parses `Cookie` header into `req.cookies`
   - `express.json()` — parses JSON request bodies into `req.body`
4. Mount routes: `app.use('/api/auth', authRoutes)`, etc.
5. `connectDB()` — connects to MongoDB Atlas
6. `app.listen(5000)` — starts accepting requests

**Request lifecycle** (e.g., `GET /api/interviews`):
1. Request arrives at Express
2. CORS middleware checks origin → allows
3. `cookieParser` extracts `voxtutor-session` from the Cookie header
4. `express.json()` parses body (empty for GET)
5. Router matches `/api/interviews` → `interviewRoutes`
6. Route has `requireAuth` middleware → verifies cookie → attaches `req.user`
7. `getUserInterviews` handler runs → queries MongoDB → sends JSON response
</details>

---

### Q40. Why is the middleware order important in Express?

<details>
<summary>Answer</summary>

Express middleware runs in the **exact order** it's registered. Getting this wrong causes bugs:

```javascript
app.use(cors(...));        // 1st: Must be first so CORS headers are on every response
app.use(cookieParser());   // 2nd: Must run before auth middleware reads cookies
app.use(express.json());   // 3rd: Must run before controllers read req.body
app.use('/api/auth', ...); // 4th: Routes run after all the above
```

If `cookieParser` ran after the auth routes, `req.cookies` would be `undefined` when `requireAuth` tries to read the session cookie. If `express.json()` ran after the routes, `req.body` would be `undefined` in controller functions.
</details>

---

### Q41. 🧠 Why do some endpoints require authentication (`requireAuth`) and others don't?

<details>
<summary>Answer</summary>

| Endpoint | Auth? | Reason |
|----------|:-----:|--------|
| `POST /api/auth/session` | ✗ | The user is authenticating — they don't have a session yet |
| `GET /api/auth/me` | ✗ | Returns `{ user: null }` for unauthenticated users (used to check login status) |
| `POST /api/interviews` | ✗ | The `userId` is sent in the request body (from the frontend's auth state) |
| `GET /api/interviews` | ✅ | Lists **all** interviews for the current user — must know who's asking |
| `GET /api/interviews/:id` | ✗ | Anyone with the ID can view (like a shareable link). Security is enforced on the frontend. |
| `GET /api/feedback/user` | ✅ | Lists all feedback for the current user — must know who's asking |

**Production improvement**: More endpoints should use `requireAuth`. Currently, `POST /api/interviews` and `POST /api/feedback` accept `userId` from the request body, which is trust-the-client. In production, I'd use `requireAuth` and read `userId` from `req.user.uid`.
</details>

---

### Q42. Why did you separate controllers from routes?

<details>
<summary>Answer</summary>

**Separation of concerns**:

- **Routes** (`routes/authRoutes.js`) define the URL-to-handler mapping and which middleware applies. They answer "which function handles which URL?"
- **Controllers** (`controllers/authController.js`) contain the business logic. They answer "what does this endpoint actually do?"

Benefits:
1. Routes are a quick reference for the API surface (you can see all endpoints at a glance)
2. Controllers can be tested independently (pass mock `req`/`res` objects)
3. If I need to change a URL structure, only the route file changes
4. If I need to change business logic, only the controller changes
5. Middleware can be swapped without touching controller code
</details>

---

## 10. Real-Time Features & Transcript Saving

### Q43. 🔥 Why do you save each transcript entry individually instead of saving the whole transcript at the end?

<details>
<summary>Answer</summary>

**Resilience against data loss**:

1. If the user's browser crashes mid-interview, all transcript entries saved so far are preserved in MongoDB
2. If the network drops temporarily, only that one entry is lost — not the entire conversation
3. The interview status changes from `'pending'` to `'active'` on the first transcript entry — so we know which interviews actually started

**Trade-off**: More API calls (one per spoken turn, roughly every 10–30 seconds). But each call is tiny (a single JSON object with role, content, timestamp) and non-blocking (fire-and-forget).

The full transcript is also kept in `transcriptRef.current` in-memory, so even if some individual saves fail, the feedback generation at the end sends the complete transcript from memory.
</details>

---

### Q44. 🧠 What happens if two transcript entries arrive at the same time? Is there a race condition?

<details>
<summary>Answer</summary>

No, because of MongoDB's `$push` operator. Two concurrent `$push` operations on the same document are handled correctly by MongoDB:

1. Both operations acquire the document-level lock (MongoDB uses WiredTiger storage engine)
2. One executes first, appending its entry
3. The other executes immediately after, appending its entry
4. Both entries end up in the array, in the correct order

This is fundamentally different from a read-modify-write approach:
```javascript
// ❌ Race condition:
const interview = await Interview.findById(id);
interview.transcript.push(entry);
await interview.save();
// If two requests do this simultaneously, one overwrites the other's push
```

`$push` is an **atomic server-side operation** — MongoDB handles the concurrency internally.
</details>

---

## 11. Frontend — Vite, Tailwind, Styling

### Q45. How does Vite's dev proxy work, and why is it needed?

<details>
<summary>Answer</summary>

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```

When the browser makes a request to `http://localhost:5173/api/interviews`:
1. Vite's dev server intercepts it (matches the `/api` prefix)
2. Forwards the request to `http://localhost:5000/api/interviews`
3. Returns the response to the browser

**Why it's needed**: The browser sees all requests going to `localhost:5173` (same origin), so:
- Cookies are sent automatically (no cross-origin cookie issues)
- No CORS errors in development
- The frontend code can use relative URLs (`/api/...`) which work in both development and production

Without the proxy, the frontend would need to use `http://localhost:5000/api/...` which introduces cross-origin complications with cookies.
</details>

---

### Q46. 🔥 How does your dark mode implementation work?

<details>
<summary>Answer</summary>

1. **CSS custom properties** in `index.css` define color tokens for both themes:
   ```css
   :root { --surface: #ffffff; --ink: #0f172a; }
   html.dark { --surface: #0f172a; --ink: #f8fafc; }
   ```

2. **ThemeToggle component** manages the `dark` class on `<html>`:
   ```javascript
   // On mount: check localStorage → then OS preference (matchMedia)
   // On toggle: add/remove 'dark' class on document.documentElement
   // Persist: localStorage.setItem('voxtutor-theme', isDark ? 'dark' : 'light')
   ```

3. **Tailwind's dark: variant** responds to the `html.dark` class:
   ```html
   <div class="bg-white dark:bg-slate-900">...</div>
   ```

**Why CSS class on `<html>` instead of React context?**
- Tailwind needs the class on `<html>` for its `dark:` variant
- CSS custom properties cascade to all children automatically
- No React re-renders when the theme changes — the browser applies CSS updates natively
- Avoids the "flash of wrong theme" on page load (the class is applied before React hydrates)
</details>

---

### Q47. How does the `ScoreRing` SVG component work?

<details>
<summary>Answer</summary>

It uses SVG's `stroke-dasharray` and `stroke-dashoffset` to create a partial circle:

1. Draw a full circle (the grey background track)
2. Draw a second circle on top with:
   - `strokeDasharray = circumference` (the full circumference as the dash pattern)
   - `strokeDashoffset = circumference - (score/100 × circumference)` (how much to hide)
3. `transform="rotate(-90)"` — starts the arc from the top (12 o'clock) instead of 3 o'clock
4. `transition: stroke-dashoffset 1.2s ease-out` — animates the ring filling on page load

For a score of 72:
- circumference = 2π × radius ≈ 270
- offset = 270 - (0.72 × 270) = 270 - 194.4 = 75.6 → 72% of the ring is visible

Color is calculated: ≥75 → green, ≥50 → yellow, <50 → red.
</details>

---

## 12. System Design — Scalability & Performance

### Q48. 🔥 How would you scale this application to handle 10,000 concurrent users?

<details>
<summary>Answer</summary>

**Current bottlenecks and solutions:**

1. **Backend (single Express instance)**:
   - Deploy multiple instances behind a **load balancer** (e.g., AWS ALB, Nginx)
   - Use **PM2 cluster mode** to utilize all CPU cores on a single server
   - Session cookies are stateless (verified by Firebase) — no sticky sessions needed

2. **MongoDB**:
   - Use **MongoDB Atlas** with auto-scaling (already using this)
   - Add **compound indexes**: `{ userId: 1, createdAt: -1 }` for dashboard queries
   - Implement **read replicas** for read-heavy queries (dashboard, feedback display)
   - Consider **sharding** by `userId` if the data grows to millions of documents

3. **Gemini API**:
   - Implement a **request queue** with rate limiting to avoid hitting API quotas
   - Add **caching** for identical question generation requests (same domain + difficulty + topics)
   - Use **circuit breaker pattern** — if Gemini is down, fall back to pre-generated questions

4. **Vapi (voice)**:
   - This is a third-party service — scalability is on Vapi's infrastructure
   - Monitor latency and implement failover to backup voice providers

5. **Frontend**:
   - Already a static SPA — serve from a **CDN** (CloudFront, Vercel)
   - Code splitting already done (Vapi SDK is dynamically imported)
</details>

---

### Q49. 🧠 Your dashboard fetches all interviews and all feedbacks, then joins them client-side. How would this perform with 1,000 interviews?

<details>
<summary>Answer</summary>

**Current approach**: Fetch up to 20 interviews + all feedbacks for the user, build a lookup map in memory, render cards.

**Problems at scale**:
- `GET /api/feedback/user` fetches ALL feedbacks (no limit) — could be hundreds
- Client-side join is O(n) but the network transfer is the real bottleneck
- The page would be slow to load with large payloads

**Solutions**:
1. **Server-side join**: Use MongoDB aggregation `$lookup` to join interviews with feedbacks in a single query:
   ```javascript
   Interview.aggregate([
     { $match: { userId } },
     { $sort: { createdAt: -1 } },
     { $limit: 20 },
     { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'interviewId', as: 'feedback' } },
     { $unwind: { path: '$feedback', preserveNullAndEmptyArrays: true } }
   ]);
   ```

2. **Pagination**: Return 10 at a time with cursor-based pagination (use `createdAt` as cursor)

3. **Projection**: Only return the fields the card needs (exclude full transcript, full feedback text):
   ```javascript
   Interview.find({ userId }).select('domain domainLabel domainIcon difficulty status createdAt')
   ```
</details>

---

### Q50. How would you implement caching to reduce database load?

<details>
<summary>Answer</summary>

| What to cache | Strategy | TTL | Invalidation |
|---|---|---|---|
| User profile (`/api/auth/me`) | In-memory (Node.js Map) or Redis | 5 min | On profile update or logout |
| Interview list (dashboard) | Redis | 30 sec | On new interview creation or completion |
| Feedback (read-only after generation) | Redis or HTTP cache-control | 1 hour | Never (feedbacks are immutable) |
| Generated questions | Redis (key: domain+difficulty+hash) | 24 hours | Never (can serve same questions to different users) |

For this project, **HTTP caching** is the lowest-effort win:
```javascript
res.set('Cache-Control', 'private, max-age=60'); // Browser caches for 60 seconds
```

For server-side caching, **Redis** would be the standard choice with `node-redis`:
```javascript
const cached = await redis.get(`feedback:${interviewId}`);
if (cached) return res.json(JSON.parse(cached));
// ... fetch from MongoDB, then cache
await redis.setex(`feedback:${interviewId}`, 3600, JSON.stringify(feedback));
```
</details>

---

## 13. System Design — Concurrency & Race Conditions

### Q51. 🔥 What race conditions exist in your application, and how did you handle them?

<details>
<summary>Answer</summary>

| Race Condition | Where | Solution |
|---|---|---|
| **Double end-interview** | Timer reaches 0 AND Vapi `call-end` fire simultaneously | `endingRef.current` flag — first caller sets it to `true`, second caller returns immediately |
| **Concurrent transcript pushes** | Two transcript entries arrive at the same time | MongoDB `$push` is atomic — handles this server-side |
| **Firebase duplicate app** | `firebase.js` imported by multiple controllers | `getApps().find(app => app.name === 'admin')` check before init |
| **State update after unmount** | User navigates away while Vapi is connecting | `isMounted` flag in the `useEffect` cleanup |
| **Double feedback generation** | User clicks "End Interview" twice rapidly | `disabled={status === 'ending'}` on the button + `endingRef` |
</details>

---

### Q52. 🧠 What if two users simultaneously create interviews and the ID generation collides?

<details>
<summary>Answer</summary>

This can't happen with MongoDB's ObjectId:

- ObjectId is a 12-byte value composed of: 4-byte timestamp + 5-byte random value + 3-byte incrementing counter
- The random component is per-process, and the counter is per-process and incremented atomically
- The probability of collision is astronomically low (effectively zero)

Even if you had 1,000 servers creating IDs simultaneously, the random seed + counter makes collisions impossible in practice. MongoDB guarantees uniqueness within a collection via the `_id` index.
</details>

---

### Q53. 🧠 Your `upsertUser` uses `findOneAndUpdate`. What happens if two sign-in requests for the same user arrive simultaneously?

<details>
<summary>Answer</summary>

MongoDB handles this safely because:

1. `findOneAndUpdate` is an atomic operation — it acquires a document-level lock
2. If both requests try to upsert the same `uid`:
   - First request acquires the lock, creates or updates the document, releases the lock
   - Second request acquires the lock, finds the document (already created), updates it, releases the lock
3. The final state is consistent — the document has the latest values from whichever request finished last

With the `upsert: true` option:
- If the document doesn't exist, MongoDB atomically checks for existence and creates it
- There's no window where two requests could both see "document doesn't exist" and both try to insert
</details>

---

## 14. System Design — Security & Attack Vectors

### Q54. 🔥 What are the potential security vulnerabilities in your application?

<details>
<summary>Answer</summary>

| Vulnerability | Risk Level | Current Mitigation | Production Fix |
|---|---|---|---|
| **XSS** | Medium | HTTP-only cookies (session can't be stolen) | Add CSP headers, sanitize user input |
| **CSRF** | Low | `sameSite: 'lax'` cookie | Add CSRF tokens for state-changing requests |
| **Insecure Direct Object Reference (IDOR)** | High | Frontend checks `userId` match | Add backend checks: `interview.userId === req.user.uid` |
| **Unauthenticated endpoints** | Medium | Some endpoints trust client-sent `userId` | Add `requireAuth` to all state-changing endpoints |
| **API rate limiting** | High | None | Add `express-rate-limit` (e.g., 100 req/min per IP) |
| **Gemini API key exposure** | Low | Stored in `.env`, not committed | Use secrets manager (AWS Secrets Manager, GCP Secret Manager) |
| **MongoDB injection** | Low | Mongoose validates and sanitizes input | Add `express-mongo-sanitize` middleware |
</details>

---

### Q55. 🧠 Your `GET /api/interviews/:id` endpoint has no authentication. Can any user view any other user's interview?

<details>
<summary>Answer</summary>

**Currently**: Yes. Anyone who knows the interview ID can fetch the full interview data including the transcript. The security check is only on the frontend (`FeedbackPage` checks `interview.userId !== user.uid` and redirects).

**Why this is bad**: Frontend security checks are client-side and can be bypassed by calling the API directly (e.g., via `curl`).

**Production fix**:
```javascript
export async function getInterview(req, res) {
  const interview = await Interview.findById(req.params.id).lean();
  
  // Add server-side authorization
  if (interview.userId !== req.user?.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  return res.json({ interview });
}
```

Or add `requireAuth` middleware and compare `req.user.uid` with `interview.userId` in every controller that accesses user-specific data.
</details>

---

### Q56. How would you implement rate limiting?

<details>
<summary>Answer</summary>

Using `express-rate-limit`:
```javascript
import rateLimit from 'express-rate-limit';

// Global: 100 requests per minute per IP
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Stricter for expensive operations (AI generation)
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.use('/api/vapi/generate', aiLimiter);
app.use('/api/feedback', aiLimiter);
```

For distributed deployments (multiple server instances), use Redis as the store:
```javascript
import RedisStore from 'rate-limit-redis';
const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000,
  max: 100,
});
```
</details>

---

## 15. System Design — Reliability & Error Handling

### Q57. 🔥 What happens if the Gemini API is down when a user tries to start an interview?

<details>
<summary>Answer</summary>

**Current behavior**:
1. `POST /api/vapi/generate` fails → catches the error → returns `500 { error: 'Failed to generate questions' }`
2. `NewInterviewButton` shows the error in a red banner: "Something went wrong. Please try again."
3. User can retry by clicking "Start Interview" again

**Production improvements**:
1. **Retry with exponential backoff**: Try 3 times (1s, 2s, 4s delays) before failing
2. **Fallback questions**: Maintain a set of pre-generated questions per domain/difficulty in a JSON file. If Gemini fails after retries, use these as a backup.
3. **Circuit breaker**: After 5 consecutive failures, stop calling Gemini for 60 seconds (prevent cascading failures and API billing)
4. **Health check**: Add a Gemini health check to the `/api/health` endpoint so monitoring can detect outages early
</details>

---

### Q58. What happens if MongoDB goes down during an interview?

<details>
<summary>Answer</summary>

**Transcript saving**: Individual `POST /api/transcript` calls would fail, but:
- They're fire-and-forget on the frontend — the UI doesn't break
- The full transcript is maintained in `transcriptRef.current` (in-memory)
- When the interview ends, the full transcript is sent to `POST /api/feedback`

**Feedback generation**: If MongoDB is down when `POST /api/feedback` tries to save:
- The Gemini analysis would succeed (no MongoDB needed)
- `Feedback.create()` would fail → 500 error
- The user would be redirected to the feedback page, which would show "Feedback is still being generated..."

**Production fix**: Use a **message queue** (Bull, RabbitMQ) for feedback generation:
1. When interview ends, push a job to the queue with the transcript
2. A worker processes the job: calls Gemini → saves to MongoDB
3. If MongoDB is temporarily down, the job stays in the queue and retries automatically
4. The feedback page polls until the feedback is available
</details>

---

### Q59. 🧠 How do you handle the case where the user has a slow internet connection during the voice interview?

<details>
<summary>Answer</summary>

**Voice quality**: Vapi uses WebRTC which has built-in adaptive bitrate — it degrades audio quality gracefully on slow connections rather than cutting out entirely.

**Transcript saving**: The fire-and-forget pattern means failed saves don't affect the interview. The in-memory ref has all entries.

**UI responsiveness**: All state updates are local — the countdown timer, mute button, and waveform animation work without network.

**What could go wrong**:
- WebRTC connection drops → Vapi emits `call-end` or `error` event → `handleEndInterview` runs
- The user sees "Voice connection error" banner + "End Interview" button
- They can still click "End Interview" to generate feedback from whatever transcript was captured

**Improvement**: Show a network quality indicator (based on WebRTC stats) so the user knows before the connection dies.
</details>

---

## 16. System Design — Architecture & Trade-offs

### Q60. 🔥 Why did you choose a monolithic Express backend instead of microservices?

<details>
<summary>Answer</summary>

**Monolith is the right choice for this project's scale because**:

1. **Complexity**: Microservices add deployment, networking, service discovery, and distributed tracing overhead. For 5 controllers and 13 endpoints, this is overkill.
2. **Data locality**: All controllers access the same MongoDB database. Microservices would need inter-service communication for simple operations.
3. **Development speed**: A single codebase is faster to develop, debug, and deploy.
4. **Latency**: No inter-service network hops. A single request goes frontend → Express → MongoDB → response.

**When I'd move to microservices**:
- If the AI generation (Gemini) needs to scale independently from the CRUD operations
- If the voice interview service needs different availability SLAs
- If multiple teams are working on different features simultaneously
- If the feedback generation becomes a long-running job that should be decoupled
</details>

---

### Q61. 🔥 Why did you choose a React SPA instead of a server-rendered framework like Next.js?

<details>
<summary>Answer</summary>

| Factor | React SPA (Vite) | Next.js |
|--------|------------------|---------|
| **Architecture** | Clean separation: React frontend + Express API | Blended: API routes + server components in one project |
| **SEO** | Not critical (dashboard is behind auth) | Would be useful for the landing page |
| **Backend control** | Full control over Express middleware, cookies, etc. | API routes are limited (no middleware chains) |
| **Deployment** | Two deployments: static files + Node.js server | One deployment (more convenient) |
| **Learning** | Demonstrates understanding of full-stack architecture | Hides backend complexity |

For a portfolio/interview project, showing a clear frontend-backend separation demonstrates deeper understanding of web architecture. The trade-off is that the landing page isn't server-rendered (slower first paint), but everything behind auth is a client-side app anyway.
</details>

---

### Q62. 🧠 If you were to redesign this project from scratch, what would you change?

<details>
<summary>Answer</summary>

1. **Server-side authorization on all endpoints**: Extract `userId` from the session cookie server-side instead of accepting it from the request body
2. **WebSocket for transcript**: Replace polling/fire-and-forget with a WebSocket connection for real-time transcript sync (enables real-time progress tracking for interviewers/observers)
3. **Job queue for feedback generation**: Use Bull + Redis so feedback generation doesn't block the HTTP response
4. **React Query for data fetching**: Better loading states, caching, and error handling
5. **TypeScript**: Type safety across the full stack would catch errors earlier
6. **Compound MongoDB indexes**: `{ userId: 1, createdAt: -1 }` for dashboard queries
7. **Input validation**: Add `joi` or `zod` schema validation on all API inputs
8. **Rate limiting**: On AI endpoints especially (Gemini calls are expensive)
9. **Error tracking**: Add Sentry for both frontend and backend error monitoring
10. **E2E tests**: Cypress or Playwright for critical user flows (sign-up → interview → feedback)
</details>

---

## 17. Database Design & Schema Questions

### Q63. 🔥 Why did you store the transcript inside the interview document instead of a separate collection?

<details>
<summary>Answer</summary>

**Embedding (current approach)**:
- ✅ Single read: `Interview.findById(id)` returns the interview + its entire transcript in one query
- ✅ Atomic writes: `$push` appends to the embedded array atomically
- ✅ Data locality: all interview data is in one place
- ❌ Document size limit: MongoDB documents have a 16MB limit. A 30-min interview transcript might be ~50KB — well within the limit.

**Separate collection (alternative)**:
- Would be needed if transcripts exceeded 16MB (very long interviews)
- Would require a JOIN (`$lookup`) to display the feedback page
- Each transcript entry would need an `interviewId` foreign key

The embedding pattern is perfect here because transcripts are **always accessed with their parent interview** and never queried independently.
</details>

---

### Q64. Why did you separate Feedback into its own collection instead of embedding it in the Interview?

<details>
<summary>Answer</summary>

1. **Timing**: The feedback is generated after the interview ends. If it were embedded, we'd need to update a large part of the interview document.

2. **Access patterns**: The dashboard needs feedback data separately from interview data:
   - `GET /api/feedback/user` returns all feedbacks for stats calculation
   - `GET /api/feedback/:interviewId` returns feedback for a specific interview
   - These queries are more efficient with a dedicated collection + index on `userId`

3. **Schema stability**: Feedback has a complex, structured schema (categories array, strengths, improvements). Keeping it separate makes the schema cleaner.

4. **Future extensibility**: We might want multiple feedback reports per interview (e.g., re-grading with different criteria). A separate collection supports this naturally.
</details>

---

### Q65. 🧠 What if the feedback generation fails after the interview status is set to 'completed'? You'd have a completed interview with no feedback.

<details>
<summary>Answer</summary>

Good catch. Looking at the code:
```javascript
// In feedbackController.js:
const feedback = await Feedback.create({ ... });       // Step 1: Save feedback
await Interview.findByIdAndUpdate(interviewId, {       // Step 2: Mark completed
  status: 'completed', completedAt: new Date().toISOString()
});
```

Actually, the feedback is created FIRST, then the interview is marked completed. So if step 2 fails:
- The feedback exists in the database
- The interview is still `'active'`
- The dashboard would show it as in-progress, but clicking it would find existing feedback

**But the real risk is**: What if `Feedback.create()` fails? Then the interview stays `'active'` and there's no feedback. The user would be redirected to the feedback page which shows "Feedback is still being generated..."

**Production fix**: Wrap both operations in a **MongoDB transaction**:
```javascript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Feedback.create([{ ... }], { session });
  await Interview.findByIdAndUpdate(id, { status: 'completed' }, { session });
});
```
This ensures both operations succeed or both fail (atomicity).
</details>

---

## 18. Deployment, DevOps & Production Readiness

### Q66. 🔥 How would you deploy this application to production?

<details>
<summary>Answer</summary>

**Frontend** (static SPA):
- `npm run build` → generates `dist/` folder with static HTML/JS/CSS
- Deploy to **Vercel**, **Netlify**, or **AWS CloudFront + S3**
- Configure the CDN to redirect all routes to `index.html` (SPA routing)

**Backend** (Node.js):
- Deploy to **AWS EC2**, **Railway**, **Render**, or **Google Cloud Run**
- Use **PM2** for process management (auto-restart on crash, cluster mode)
- Set `NODE_ENV=production` → enables `secure: true` on cookies

**Database**:
- **MongoDB Atlas** (already cloud-hosted) — just whitelist the backend server's IP

**Environment variables**:
- Use the hosting platform's secrets manager (not `.env` files in production)

**DNS + SSL**:
- Point a domain to the frontend CDN
- Configure the backend URL in the frontend's environment variables
- Ensure HTTPS is enabled (required for `secure: true` cookies)
</details>

---

### Q67. How would you handle environment variables securely in production?

<details>
<summary>Answer</summary>

| Environment Variable | Sensitivity | Production Strategy |
|---|---|---|
| `VITE_FIREBASE_*` | Public (safe to expose) | Hardcode in build or environment config |
| `VITE_VAPI_KEY` | Semi-public (restricted by Vapi dashboard) | Build-time environment variable |
| `MONGO_URI` | Secret (database credentials) | Secrets manager (AWS SM, GCP SM) |
| `GEMINI_API_KEY` | Secret (API billing) | Secrets manager |
| `FIREBASE_PRIVATE_KEY` | Highly secret (admin access) | Secrets manager, never in code |

Never commit `.env` files to git (`.gitignore` handles this). In production, use the hosting platform's secrets management UI or a dedicated secrets manager service.
</details>

---

### Q68. 🧠 What monitoring and observability would you add for production?

<details>
<summary>Answer</summary>

1. **Error tracking**: Sentry (frontend + backend) — captures errors with stack traces and context
2. **Logging**: Winston or Pino (structured JSON logs) → ship to CloudWatch / Datadog / ELK
3. **Metrics**: Track API response times, Gemini API latency, Vapi connection success rate
4. **Health check**: Already have `GET /api/health` — add checks for MongoDB connectivity and Gemini API reachability
5. **Alerting**: PagerDuty / Slack alerts for:
   - Error rate > 1% over 5 minutes
   - API response time > 5 seconds (P99)
   - MongoDB connection failures
   - Gemini API failures
6. **Analytics**: Track user funnel (sign-up → first interview → completed → viewed feedback) using Mixpanel or PostHog
</details>

---

## 19. Code Quality & Best Practices

### Q69. 🔥 How do you handle the `_id` to `id` conversion in your API responses?

<details>
<summary>Answer</summary>

MongoDB uses `_id` (ObjectId), but the frontend expects `id` (string). The conversion happens in every controller:

```javascript
const interview = createdInterview.toJSON();
interview.id = interview._id.toString();
```

For arrays:
```javascript
interviews.forEach(interview => {
  interview.id = interview._id.toString();
});
```

**This is repetitive. Production improvements**:

1. **Mongoose transform**: Set a global or per-schema `toJSON` transform:
   ```javascript
   interviewSchema.set('toJSON', {
     transform: (doc, ret) => {
       ret.id = ret._id.toString();
       delete ret._id;
       delete ret.__v;
     }
   });
   ```

2. **Virtual property**:
   ```javascript
   interviewSchema.virtual('id').get(function() { return this._id.toString(); });
   ```
</details>

---

### Q70. Why don't you use TypeScript?

<details>
<summary>Answer</summary>

JavaScript was chosen for faster prototyping — fewer files, no compilation step, faster iteration. For a portfolio project, the priority was shipping a working product.

**What TypeScript would add**:
- Type safety for API request/response bodies (catch mismatches at compile time)
- Interface definitions for MongoDB documents (currently using Mongoose schemas for validation)
- Better IDE autocompletion and refactoring support
- Self-documenting code (types serve as documentation)

**Migration path**: If I were to add TypeScript:
1. Add `tsconfig.json` to both frontend and backend
2. Rename files `.js` → `.ts` / `.jsx` → `.tsx`
3. Define interfaces for all API payloads, model shapes, and component props
4. Add `@types/*` packages for Express, Mongoose, etc.
</details>

---

### Q71. How would you add input validation to your API endpoints?

<details>
<summary>Answer</summary>

Currently, controllers trust the request body without validation. With `zod`:

```javascript
import { z } from 'zod';

const createInterviewSchema = z.object({
  userId: z.string().min(1),
  domain: z.enum(['software', 'finance', 'marketing', 'product', 'data_science', 'consulting']),
  domainLabel: z.string(),
  domainIcon: z.string(),
  difficulty: z.enum(['entry', 'mid', 'senior']),
  duration: z.enum([10, 20, 30]),
  questions: z.array(z.string()).min(1).max(10),
});

export async function createInterview(req, res) {
  const parsed = createInterviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }
  // ... use parsed.data instead of req.body
}
```

Benefits:
- Catches invalid data before it reaches MongoDB
- Returns descriptive error messages
- Self-documenting API contracts
- Prevents injection attacks (only expected fields are accepted)
</details>

---

## 20. Behavioral / "Why Did You..." Questions

### Q72. 🔥 Why did you build this project?

<details>
<summary>Answer</summary>

I wanted to solve a real problem: interview preparation is typically text-based (reading questions, typing answers), but real interviews are verbal. I built VoxTutor to bridge this gap — it creates a realistic interview simulation with voice interaction and provides structured, actionable feedback.

It also let me work across the full stack: React for the UI, Express for the API, MongoDB for persistence, Firebase for auth, Vapi for voice AI, and Gemini for intelligent question/feedback generation. Each feature presented a different technical challenge.
</details>

---

### Q73. 🔥 What was the most challenging part of building this project?

<details>
<summary>Answer</summary>

The **live voice interview component** (`InterviewPageClient.jsx`). Challenges included:

1. **Stale closures**: Event handlers registered on mount captured stale state values. Solved with `useRef` for the transcript.
2. **Race conditions**: Timer and Vapi events could both trigger end-interview simultaneously. Solved with `endingRef`.
3. **Async cleanup**: Navigating away while connecting could cause state updates on unmounted components. Solved with `isMounted` flag.
4. **Real-time transcript sync**: Balancing fire-and-forget persistence with in-memory reliability.
5. **Prompt engineering**: Getting the AI interviewer to ask questions one at a time, ask follow-ups, and end gracefully required multiple iterations of the system prompt.
</details>

---

### Q74. What would you add next if you had more time?

<details>
<summary>Answer</summary>

1. **Resume interview**: If the browser closes mid-interview, let the user continue from where they left off
2. **Interview analytics**: Charts showing score trends over time, performance by domain
3. **Custom question sets**: Let users upload their own questions
4. **Recording playback**: Record and replay the voice interview (audio + transcript sync)
5. **Multi-language support**: Conduct interviews in different languages
6. **Admin dashboard**: View aggregate stats, user engagement, popular domains
7. **Mobile responsive**: Currently optimized for desktop; the two-panel interview layout needs a mobile adaptation
8. **WebSocket transcript**: Real-time sync instead of fire-and-forget HTTP
9. **E2E testing**: Cypress/Playwright tests for the critical user flows
10. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
</details>

---

### Q75. 🔥 If you had to explain this project to a non-technical person in 30 seconds, what would you say?

<details>
<summary>Answer</summary>

"VoxTutor is like having a personal interview coach available 24/7. You pick a job domain — like software engineering or finance — and an AI interviewer actually talks to you, asks you questions, and listens to your answers, just like a real interview. When you're done, it gives you a detailed report card showing what you did well and what to practice next. It's all through your browser — no downloads needed."
</details>

---

### Q76. 🧠 Walk me through how you would debug an issue where the feedback page shows "Feedback is still being generated" even though the interview ended 5 minutes ago.

<details>
<summary>Answer</summary>

**Systematic debugging approach**:

1. **Check the interview status**: Query MongoDB — is the interview `status` set to `'completed'` or still `'active'`?
   - If `'active'` → `handleEndInterview` didn't run or failed before calling the feedback API

2. **Check the feedback collection**: Does a feedback document with this `interviewId` exist?
   - If no → the `POST /api/feedback` call either wasn't made or failed

3. **Check backend logs**: Look for `Feedback generation error` console output
   - Common causes: Gemini API key expired, Gemini returned malformed JSON, MongoDB write failed

4. **Check the frontend**: In the browser's Network tab, was `POST /api/feedback` called?
   - If not → the `handleEndInterview` function didn't reach the fetch call
   - Possible: `vapi.stop()` threw an error that was caught but prevented the rest of the function from running

5. **Check Gemini API**: Was the transcript too long? Did Gemini return a valid response?
   - Test by calling the API manually with the same transcript

6. **Root cause likely**: The `POST /api/feedback` call failed silently. The catch block logs to console but doesn't retry. The user is still navigated to the feedback page, which finds no feedback and shows the "still generating" message.

**Fix**: Add retry logic, save error state to the interview document, and show a meaningful error on the feedback page instead of a generic "still generating" message.
</details>

---

---

## 21. JavaScript & Node.js Core Concepts

### Q77. 🔥 Explain the difference between `import` and `require`. Why does your backend use `import`?

<details>
<summary>Answer</summary>

| Feature | `require` (CommonJS) | `import` (ES Modules) |
|---------|---------------------|----------------------|
| **Syntax** | `const express = require('express')` | `import express from 'express'` |
| **Loading** | Synchronous, at runtime | Statically analyzed, before execution |
| **Tree-shaking** | ❌ Not possible | ✅ Bundlers can remove unused exports |
| **Top-level await** | ❌ Not supported | ✅ Supported |
| **Standard** | Node.js-specific | Official JavaScript standard (ECMAScript) |

My backend uses `import` because `package.json` has `"type": "module"`. This enables:
- Consistent syntax between frontend (Vite/React already uses `import`) and backend
- Top-level `await` in `index.js` if needed
- Named exports/imports for better code organization

The key Node.js requirement: you must use `.js` extensions in relative imports (`'./config/db.js'` not `'./config/db'`).
</details>

---

### Q78. 🔥 What is the Event Loop in Node.js? How does it relate to your Express server handling multiple interview requests?

<details>
<summary>Answer</summary>

Node.js is **single-threaded** but handles concurrency through the **Event Loop**:

```
   ┌───────────────────────────┐
┌─>│        Timers              │  (setTimeout, setInterval callbacks)
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │     Pending Callbacks      │  (I/O callbacks deferred from previous cycle)
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │       Poll                 │  (Retrieve new I/O events; execute I/O callbacks)
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │       Check                │  (setImmediate callbacks)
│  └───────────┬───────────────┘
│  ┌───────────▼───────────────┐
│  │     Close Callbacks        │  (socket.on('close'), etc.)
│  └───────────┬───────────────┘
└──────────────┘
```

**How it applies to VoxTutor:**

When 100 users simultaneously hit `POST /api/feedback`:
1. Express receives all 100 requests on the single thread
2. Each handler calls `await ai.models.generateContent(...)` — this is an **async I/O operation** (network call to Gemini)
3. Node.js registers the callback and **moves to the next request** — it doesn't wait
4. When each Gemini response arrives, the callback is placed in the Event Loop's poll queue
5. Node.js executes each callback one at a time, sending responses back

This is why Node.js can handle thousands of concurrent I/O-bound requests on a single thread — it never blocks waiting for network responses.

**Where this breaks down**: CPU-intensive work (e.g., parsing a massive JSON) blocks the event loop. For VoxTutor, `JSON.parse()` on Gemini responses is trivially fast, so this isn't a concern.
</details>

---

### Q79. 🧠 What is `process.exit(1)` in your `connectDB` function? What does the `1` mean?

<details>
<summary>Answer</summary>

```javascript
catch (error) {
  console.error('❌ MongoDB connection error:', error.message);
  process.exit(1);
}
```

- `process.exit(0)` → successful termination (exit code 0 = success)
- `process.exit(1)` → failure termination (any non-zero code = error)

**Why exit on DB failure?** The entire backend depends on MongoDB. Without a database connection:
- `requireAuth` can't look up users
- Controllers can't create/read interviews or feedback
- Every API request would fail with a 500 error

It's better to crash immediately so:
- The error is visible in logs (not hidden behind continuous 500 errors)
- Process managers like PM2 or Docker can **auto-restart** the process
- Health checks can detect the server is down and alert operators
</details>

---

### Q80. What is the difference between `==` and `===` in JavaScript? Where do you use each?

<details>
<summary>Answer</summary>

- `==` (loose equality): Performs **type coercion** before comparing. `"5" == 5` is `true`.
- `===` (strict equality): No type coercion. `"5" === 5` is `false`.

In the entire VoxTutor codebase, I use `===` everywhere. Loose equality leads to unpredictable bugs:
```javascript
0 == ""     // true (both coerced to 0)
null == undefined  // true
[] == false // true
```

The only place `==` is somewhat acceptable is checking for `null`/`undefined` simultaneously: `value == null` catches both. But I prefer explicit checks: `value === null || value === undefined`.
</details>

---

### Q81. 🔥 Explain `async/await` vs `.then()` chains. Why does your codebase use `async/await` everywhere?

<details>
<summary>Answer</summary>

Both handle Promises, but `async/await` is superior for readability:

**`.then()` chain (harder to read):**
```javascript
function loadDashboardData() {
  return apiGet('/interviews')
    .then(interviewData => {
      return apiGet('/feedback/user')
        .then(feedbackData => {
          setInterviews(interviewData.interviews);
          setFeedbacks(feedbackData.feedbacks);
        });
    })
    .catch(error => console.error(error))
    .finally(() => setLoading(false));
}
```

**`async/await` (used in VoxTutor):**
```javascript
async function loadDashboardData() {
  try {
    const [interviewData, feedbackData] = await Promise.all([
      apiGet('/interviews'),
      apiGet('/feedback/user'),
    ]);
    setInterviews(interviewData.interviews);
    setFeedbacks(feedbackData.feedbacks);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}
```

Advantages of `async/await`:
- Reads like synchronous code (top-to-bottom)
- `try/catch` for error handling (instead of `.catch()` chaining)
- Easier to debug (stack traces are clearer)
- Works naturally with `Promise.all` for concurrent operations
</details>

---

### Q82. 🧠 What is `Promise.all` and why do you use it in `DashboardPage`? What happens if one of the promises rejects?

<details>
<summary>Answer</summary>

```javascript
const [interviewData, feedbackData] = await Promise.all([
  apiGet('/interviews'),
  apiGet('/feedback/user'),
]);
```

`Promise.all` runs multiple promises **concurrently** and waits for all to complete. Without it:
```javascript
const interviewData = await apiGet('/interviews');   // Wait 200ms
const feedbackData = await apiGet('/feedback/user'); // Wait 200ms
// Total: ~400ms (sequential)
```

With `Promise.all`:
```javascript
// Both requests fire simultaneously
// Total: ~200ms (concurrent — whichever takes longer)
```

**If one rejects**: `Promise.all` **fails fast** — the entire `await` throws immediately, and the successful response is discarded. The `catch` block runs.

**Alternative**: `Promise.allSettled` returns results for all promises regardless of individual success/failure:
```javascript
const results = await Promise.allSettled([apiGet('/interviews'), apiGet('/feedback/user')]);
// results[0].status === 'fulfilled' or 'rejected'
// results[1].status === 'fulfilled' or 'rejected'
```

I'd use `allSettled` if I wanted to show the interview list even when the feedback fetch fails.
</details>

---

### Q83. What is the spread operator (`...`) and where do you use it in the project?

<details>
<summary>Answer</summary>

The spread operator `...` expands an iterable (array/object) into individual elements:

**1. Spreading AI response into Mongoose model** (`feedbackController.js`):
```javascript
const analysis = JSON.parse(result.text);
const feedback = await Feedback.create({
  interviewId,
  userId,
  ...analysis,  // Spreads { overallScore, verdict, summary, categories, ... }
});
```
This avoids listing every field manually.

**2. Immutable array updates** (`InterviewPageClient.jsx`):
```javascript
transcriptRef.current = [...transcriptRef.current, newEntry];
// Creates a new array with all old entries + the new one
```
React requires new array references to trigger re-renders.

**3. API headers merge** (`api.js`):
```javascript
headers: {
  'Content-Type': 'application/json',
  ...options.headers,  // Caller can override headers
}
```

**4. Object merging** (`authController.js`):
```javascript
{ uid, name, email, photoURL: photoURL || '' }
// Could also be written as: { ...req.body, photoURL: req.body.photoURL || '' }
```
</details>

---

### Q84. 🔥 What is destructuring? Give examples from your codebase.

<details>
<summary>Answer</summary>

Destructuring extracts values from objects/arrays into named variables:

**Object destructuring (controllers):**
```javascript
const { idToken } = req.body;
// Equivalent to: const idToken = req.body.idToken;

const { uid, name, email, photoURL } = req.body;
// Extracts 4 properties in one line
```

**Array destructuring (dashboard):**
```javascript
const [interviewData, feedbackData] = await Promise.all([...]);
// First element → interviewData, second → feedbackData
```

**Parameter destructuring (components):**
```javascript
export default function InterviewCard({ interview, feedback }) {
  // Props are destructured directly in the function signature
}
```

**Renamed destructuring (Vapi dynamic import):**
```javascript
const { default: Vapi } = await import('@vapi-ai/web');
// Renames the 'default' export to 'Vapi'
```

**Nested destructuring:**
```javascript
const { connection: { host } } = await mongoose.connect(uri);
// Extracts connection.host directly
```
</details>

---

### Q85. What does `.lean()` return compared to a normal Mongoose query? What methods are missing on a lean document?

<details>
<summary>Answer</summary>

| Feature | Normal Document | `.lean()` Result |
|---------|----------------|-----------------|
| **Type** | Mongoose Document instance | Plain JavaScript Object (POJO) |
| **`.save()`** | ✅ Available | ❌ Not available |
| **`.populate()`** | ✅ Available | ❌ Not available |
| **Change tracking** | ✅ Tracks modified fields | ❌ No tracking |
| **Virtuals** | ✅ Computed properties work | ❌ Not included (unless configured) |
| **Getters/setters** | ✅ Custom getters run | ❌ Raw values only |
| **Memory usage** | Higher (stores metadata) | Lower (just data) |
| **Speed** | Slower (Document construction) | **2–5x faster** |

I use `.lean()` on every read-only query (dashboard, feedback display). The only time you'd skip it is when you need to call `.save()` on the returned document.
</details>

---

## 22. HTTP, Networking & API Concepts

### Q86. 🔥 Explain the HTTP request lifecycle when the dashboard page loads.

<details>
<summary>Answer</summary>

When a logged-in user navigates to `/dashboard`:

```
Browser                    Vite Dev Server (:5173)        Express (:5000)          MongoDB Atlas
  │                              │                            │                        │
  │ ── GET /api/interviews ────►│                            │                        │
  │    Cookie: voxtutor-session  │── Forward to :5000 ──────►│                        │
  │                              │                            │                        │
  │                              │                            │── cookieParser() ──►   │
  │                              │                            │   req.cookies set      │
  │                              │                            │                        │
  │                              │                            │── requireAuth() ──►    │
  │                              │                            │   verifySessionCookie  │
  │                              │                            │   ── User.findOne ───►│
  │                              │                            │   ◄── user object ────│
  │                              │                            │   req.user = user      │
  │                              │                            │                        │
  │                              │                            │── getUserInterviews()  │
  │                              │                            │   ── Interview.find ──►│
  │                              │                            │   ◄── [documents] ────│
  │                              │                            │                        │
  │                              │◄── JSON response ─────────│                        │
  │◄── JSON response ───────────│                            │                        │

Total network calls from browser: 2 (interviews + feedback, concurrent via Promise.all)
Total MongoDB queries per call: 2 (User.findOne in middleware + Interview.find in handler)
```

**HTTP details for each request:**
- Method: `GET`
- Headers: `Cookie: voxtutor-session=...`, `Content-Type: application/json`
- Response: `200 OK` with `{ interviews: [...] }`
</details>

---

### Q87. 🔥 What are HTTP status codes? Which ones does your API return and when?

<details>
<summary>Answer</summary>

| Code | Meaning | Where Used |
|------|---------|-----------|
| **200** | OK — request succeeded | All successful responses (interviews list, feedback data, session created) |
| **400** | Bad Request — invalid input | `appendTranscript` when interviewId or entry is missing |
| **401** | Unauthorized — no valid credentials | `requireAuth` middleware (missing/invalid/expired cookie) |
| **404** | Not Found — resource doesn't exist | `getInterview` when the ID doesn't match any document |
| **500** | Internal Server Error — something broke | All catch blocks (DB failure, Gemini API error, etc.) |

**Missing but should add for production:**
| Code | When |
|------|------|
| **403 Forbidden** | User is authenticated but tries to access another user's interview |
| **429 Too Many Requests** | Rate limit exceeded |
| **422 Unprocessable Entity** | Input validation fails (valid JSON but invalid data) |
| **503 Service Unavailable** | Gemini API or MongoDB is down |
</details>

---

### Q88. What is CORS? Why do you need it and how does your backend configure it?

<details>
<summary>Answer</summary>

**CORS** (Cross-Origin Resource Sharing) is a browser security mechanism that blocks requests from one origin (domain:port) to a different origin.

**Why it's needed**: Frontend runs on `localhost:5173`, backend on `localhost:5000` — different ports = different origins. Without CORS config, the browser would block all API requests.

**Backend configuration:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

- `origin`: Only allows requests from this specific frontend URL (not `*` which would allow any site)
- `credentials: true`: Allows cookies to be sent with cross-origin requests (required for session cookies)

**What happens behind the scenes:**
1. Browser sends a **preflight** `OPTIONS` request before actual requests
2. Express's cors middleware responds with headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`
3. Browser verifies the headers match → allows the actual request to proceed

**In production**: With both served from the same domain, CORS isn't needed. But the config should stay for staging environments or API consumers.
</details>

---

### Q89. 🧠 What's the difference between `res.json()` and `res.send()`? Why do you use `res.json()` everywhere?

<details>
<summary>Answer</summary>

| Method | What it does |
|--------|-------------|
| `res.send(data)` | Sends a response. If `data` is an object, calls `JSON.stringify()` internally. Sets `Content-Type` based on data type. |
| `res.json(data)` | Always calls `JSON.stringify()`. Always sets `Content-Type: application/json`. Calls `JSON.replacer` if configured. |

**Why `res.json()`:**
1. Explicit — the reader knows this endpoint returns JSON
2. Forces `Content-Type: application/json` header (important for the frontend's `response.json()` parser)
3. Handles edge cases better (e.g., `null`, `undefined` values in objects)
4. Convention in REST APIs — every endpoint should return JSON for consistency
</details>

---

### Q90. What is the `cookie-parser` middleware and why is it needed?

<details>
<summary>Answer</summary>

Without `cookie-parser`:
```javascript
req.cookies  // → undefined
req.headers.cookie  // → "voxtutor-session=abc123; other-cookie=xyz"
// You'd have to manually parse this string
```

With `cookie-parser`:
```javascript
app.use(cookieParser());
req.cookies  // → { 'voxtutor-session': 'abc123', 'other-cookie': 'xyz' }
// Automatically parsed into a JavaScript object
```

It also provides `res.cookie()` for setting cookies with options (maxAge, httpOnly, etc.) and `res.clearCookie()` for deleting them. The `requireAuth` middleware relies on `req.cookies['voxtutor-session']` — without cookie-parser, this would be `undefined`.
</details>

---

### Q91. 🧠 What is `credentials: 'include'` in your fetch calls? What happens without it?

<details>
<summary>Answer</summary>

`fetch()` has three credential modes:

| Mode | Behavior |
|------|----------|
| `'omit'` | Never send cookies (default for cross-origin requests in some cases) |
| `'same-origin'` | Only send cookies to the same origin (default) |
| `'include'` | **Always** send cookies, even for cross-origin requests |

Without `credentials: 'include'`, the `voxtutor-session` cookie would NOT be sent with API requests (because `localhost:5173` → `localhost:5000` is cross-origin). The `requireAuth` middleware would see no cookie and return 401 for every protected route.

The backend must also opt-in with `cors({ credentials: true })` — otherwise the browser rejects the response even if the cookie was sent.
</details>

---

## 23. Testing Strategy

### Q92. 🔥 How would you test this application? What testing strategy would you use?

<details>
<summary>Answer</summary>

**Testing Pyramid:**

```
        ┌─────────────┐
        │   E2E Tests  │  ← Fewest (slow, expensive)
        │   (Cypress)  │
       ─┼─────────────┼─
       │  Integration   │
       │  Tests (API)   │  ← Middle layer
      ─┼───────────────┼─
      │   Unit Tests     │
      │   (Jest/Vitest)  │  ← Most (fast, cheap)
     ─┴─────────────────┴─
```

**Unit Tests** (Vitest/Jest):
- Test individual functions: `formatTime(305)` should return `"05:05"`
- Test Mongoose model validation: creating a User without `uid` should fail
- Test utility functions: score color calculation, verdict badge mapping

**Integration Tests** (Supertest + Jest):
- Test API endpoints with a real MongoDB test instance:
  ```javascript
  const res = await request(app).post('/api/interviews').send({ userId: '123', ... });
  expect(res.status).toBe(200);
  expect(res.body.interview.status).toBe('pending');
  ```
- Test auth flow: create session → access protected route → verify cookie

**E2E Tests** (Cypress/Playwright):
- Full user flows: sign-up → create interview → verify redirect → view feedback
- Mock Vapi and Gemini APIs (don't make real API calls in tests)

**What I'd test first** (highest ROI):
1. Auth flow (most critical — broken auth = broken app)
2. Interview creation API (validates data flow to MongoDB)
3. Feedback generation API (validates Gemini integration + DB writes)
</details>

---

### Q93. How would you mock the Gemini API for testing?

<details>
<summary>Answer</summary>

**Option 1: Dependency injection** — pass the AI client as a parameter:
```javascript
export function createGenerateController(aiClient) {
  return async function generateQuestions(req, res) {
    const result = await aiClient.models.generateContent({ ... });
    // ...
  };
}

// In production: createGenerateController(new GoogleGenAI({ apiKey }))
// In tests: createGenerateController(mockAIClient)
```

**Option 2: Module mocking** with Jest/Vitest:
```javascript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify(["Question 1?", "Question 2?"]),
      }),
    },
  })),
}));
```

**Option 3: HTTP-level mocking** with `nock` or `msw`:
```javascript
nock('https://generativelanguage.googleapis.com')
  .post(/.*/)
  .reply(200, { text: '["Q1?", "Q2?"]' });
```

I'd prefer Option 2 for unit tests (fastest) and Option 1 for cleaner architecture.
</details>

---

### Q94. 🧠 How would you test the `requireAuth` middleware in isolation?

<details>
<summary>Answer</summary>

Create mock `req`, `res`, and `next` objects:

```javascript
import { requireAuth } from '../middleware/auth.js';

// Mock Firebase Admin
vi.mock('../config/firebase.js', () => ({
  adminAuth: () => ({
    verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  }),
}));

// Mock User model
vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({ uid: 'test-uid', name: 'Test User' }),
    }),
  },
}));

test('attaches user to req when cookie is valid', async () => {
  const req = { cookies: { 'voxtutor-session': 'valid-cookie' } };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();

  await requireAuth(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(req.user).toEqual({ uid: 'test-uid', name: 'Test User' });
});

test('returns 401 when no cookie present', async () => {
  const req = { cookies: {} };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();

  await requireAuth(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
});
```
</details>

---

## 24. Advanced Design Patterns in the Codebase

### Q95. 🔥 What design patterns do you use in this project?

<details>
<summary>Answer</summary>

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Singleton** | `firebase.js` (Admin SDK init) | Ensures only one Firebase app instance exists |
| **Provider / Context** | `AuthProvider` + `useAuth` | Global state sharing without prop drilling |
| **Middleware Chain** | Express middleware (`cors → cookieParser → json → requireAuth → handler`) | Each middleware handles one concern |
| **Observer** | Vapi event listeners (`on('call-start')`, `on('message')`) | Decoupled event handling |
| **Facade** | `api.js` (`apiFetch`, `apiGet`, `apiPost`) | Simplifies complex fetch API into easy functions |
| **Upsert (Create-or-Update)** | `upsertUser` with `findOneAndUpdate` | Handles both create and update in one operation |
| **Guard Clause** | `if (endingRef.current) return;` | Early return to prevent duplicate execution |
| **Layout / Template** | `RootLayout` / `AuthLayout` with `<Outlet/>` | Shared UI structure with swappable content |
| **Lazy Loading** | `await import('@vapi-ai/web')` | Load code only when needed (code splitting) |
| **Fire-and-Forget** | Transcript saving during interview | Non-blocking async operations where failure is acceptable |
</details>

---

### Q96. 🧠 Explain the Middleware pattern in Express. How is it different from a decorator pattern?

<details>
<summary>Answer</summary>

**Middleware pattern**: Functions that sit between the request and the response, forming a **pipeline**. Each middleware can:
- Modify `req` or `res`
- Call `next()` to pass to the next middleware
- Send a response (ending the pipeline)

```
Request → CORS → CookieParser → JSON Parser → requireAuth → Controller → Response
```

**Decorator pattern**: Wraps a function to add behavior:
```javascript
function withAuth(handler) {
  return async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    return handler(req, res);
  };
}
// Usage: app.get('/api/data', withAuth(myHandler));
```

**Key differences**:
| Aspect | Middleware | Decorator |
|--------|-----------|-----------|
| **Composability** | Linear chain via `app.use()` | Nested function wrapping |
| **Scope** | Can apply globally (`app.use`) or per-route | Per-handler |
| **Ordering** | Explicit (registration order) | Implicit (nesting order) |
| **State passing** | Via `req` object mutation | Via closure or arguments |

Express uses middleware because it's more flexible — you can apply auth globally to a router or selectively to individual routes.
</details>

---

### Q97. What is the Provider pattern in React? How does `AuthProvider` implement it?

<details>
<summary>Answer</summary>

The Provider pattern uses React Context to share state across the component tree without passing props through every level (prop drilling).

**Implementation in VoxTutor:**

1. **Create context**: `const AuthContext = createContext(null);`

2. **Provider component** wraps the app and holds state:
   ```jsx
   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);

     return (
       <AuthContext.Provider value={{ user, loading, login, logout }}>
         {children}
       </AuthContext.Provider>
     );
   }
   ```

3. **Custom hook** provides a clean API for consumers:
   ```javascript
   export function useAuth() {
     const context = useContext(AuthContext);
     if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
     return context;
   }
   ```

4. **Any component** can now access auth state:
   ```javascript
   const { user, logout } = useAuth(); // No need to pass as props
   ```

**Why the error check in `useAuth`?** If someone accidentally uses `useAuth()` outside of `<AuthProvider>`, `useContext` returns the default value (`null`). Throwing a descriptive error immediately surfaces the bug instead of causing cryptic `Cannot read property 'user' of null` errors later.
</details>

---

## 25. "What Would Happen If..." Scenarios

### Q98. 🔥 What happens if two users sign up with the same email at the exact same time?

<details>
<summary>Answer</summary>

**Firebase Auth handles this**: `createUserWithEmailAndPassword` enforces email uniqueness at the Firebase level. One request succeeds, the other gets error code `auth/email-already-in-use`.

**On the MongoDB side**: Both would call `upsertUser` with different UIDs (Firebase assigns unique UIDs). They'd create two separate MongoDB documents — which is correct because they are two different Firebase users (the second sign-up would have failed at the Firebase step).

**Edge case**: If Firebase somehow allowed both (impossible, but hypothetically), MongoDB's `unique: true` index on `uid` would prevent duplicate UIDs. The second `findOneAndUpdate` with `upsert: true` would update instead of creating a duplicate.
</details>

---

### Q99. 🧠 What happens if the user's JWT session cookie expires mid-interview?

<details>
<summary>Answer</summary>

The session cookie has a 7-day expiry, so mid-interview expiry is extremely unlikely. But if it happened:

1. **Voice interview continues** — Vapi's WebRTC connection is independent of our backend auth
2. **Transcript saves fail silently** — `POST /api/transcript` doesn't use `requireAuth`, so it would actually still work (this endpoint is unauthenticated)
3. **Feedback generation works** — `POST /api/feedback` is also unauthenticated
4. **After feedback**: `FeedbackPage` calls `apiGet('/interviews/:id')` (unauthenticated, still works) and `apiGet('/feedback/:id')` (unauthenticated, still works)
5. **Dashboard would break**: `GET /api/interviews` uses `requireAuth` — would return 401
6. **`useAuth` would return `user: null`**: On next page load, `GET /api/auth/me` would return `{ user: null }` → `RootLayout` redirects to sign-in

**Net effect**: The interview and feedback flow would complete, but the user would be logged out when they try to return to the dashboard.
</details>

---

### Q100. What happens if MongoDB's 16MB document limit is exceeded by a very long interview transcript?

<details>
<summary>Answer</summary>

**Quick math**: A 30-minute interview might have ~60 transcript entries (30 questions/answers + follow-ups). Each entry is roughly:
```json
{ "role": "user", "content": "200 words average", "timestamp": "2025-01-15T10:30:00Z" }
```
≈ 1KB per entry × 60 entries = ~60KB. Far below the 16MB limit.

**To hit 16MB**, you'd need ~16,000 transcript entries — that's an interview lasting several days.

**If it ever became a concern:**
1. Move transcript to a separate collection: `TranscriptEntry { interviewId, role, content, timestamp }`
2. Use MongoDB's GridFS for very large documents
3. Compress content or summarize older entries
4. Set a maximum interview duration (already done: 30 min max)
</details>

---

### Q101. 🧠 What if Vapi's servers go down in the middle of an interview?

<details>
<summary>Answer</summary>

1. Vapi emits an `error` event with the error message
2. The `error` handler in `InterviewPageClient` checks:
   - If the message contains "Meeting has ended" → triggers `handleEndInterview()`
   - Otherwise → shows error banner: "Voice connection error. Click 'End Interview' to get your feedback."
3. The user can still click "End Interview"
4. `handleEndInterview` sends whatever transcript was captured (from `transcriptRef.current`) to `POST /api/feedback`
5. Gemini generates feedback based on the partial transcript
6. User gets a feedback report (scored on whatever was discussed)

**The key design decision**: The transcript is stored both in MongoDB (via individual saves) AND in-memory (`transcriptRef`). Even if some saves failed during the outage, the in-memory copy has everything.
</details>

---

### Q102. What happens if someone sends a `POST /api/feedback` with a fake transcript?

<details>
<summary>Answer</summary>

**Currently**: Nothing prevents this. Someone could call:
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"...", "userId":"...", "transcript":[{"role":"user","content":"I am a genius"}]}'
```

This would:
1. Generate feedback based on the fake transcript (Gemini would give a high score for "I am a genius")
2. Save it to MongoDB
3. Mark the interview as completed

**Production fixes:**
1. **Server-side transcript**: Don't accept the transcript from the client. Read it from the interview document in MongoDB (which was built from verified Vapi callbacks).
2. **Authentication**: Add `requireAuth` and verify `req.user.uid === interview.userId`
3. **Duplicate check**: Before generating, check if feedback already exists for this interview
4. **Webhook verification**: Use Vapi's webhook signatures to verify transcript authenticity
</details>

---

### Q103. 🔥 What would happen if you forgot to call `next()` in the `requireAuth` middleware?

<details>
<summary>Answer</summary>

The request would **hang forever**. Express wouldn't know to move to the next middleware or route handler. The client would eventually time out (browser shows "ERR_CONNECTION_TIMED_OUT").

```javascript
export async function requireAuth(req, res, next) {
  const session = req.cookies['voxtutor-session'];
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const decoded = await adminAuth().verifySessionCookie(session, true);
  const user = await User.findOne({ uid: decoded.uid }).lean();
  req.user = user;

  // If you forget this line:
  next();  // ← Without this, the route handler NEVER runs
}
```

This is why every middleware function MUST either:
- Call `next()` to continue the chain, OR
- Send a response (`res.json()`, `res.status().json()`) to end the chain

Doing neither causes a hanging request. Doing both causes a "headers already sent" error.
</details>

---

## 26. Rapid-Fire — Explain in One Line

### Q104. What is `useEffect`?
<details><summary>Answer</summary>A React hook that runs side effects (API calls, subscriptions, DOM updates) after the component renders. Dependencies array controls when it re-runs.</details>

### Q105. What is `useState`?
<details><summary>Answer</summary>A React hook that adds reactive state to a functional component — returns `[currentValue, setterFunction]`, and calling the setter triggers a re-render.</details>

### Q106. What is `useRef`?
<details><summary>Answer</summary>A React hook that creates a mutable container (`.current`) that persists across renders without triggering re-renders when changed — perfect for DOM refs and mutable values in callbacks.</details>

### Q107. What is `useCallback`?
<details><summary>Answer</summary>A React hook that memoizes a function so it keeps the same reference across renders — prevents unnecessary re-renders of child components that depend on the function as a prop or effect dependency.</details>

### Q108. What is `useContext`?
<details><summary>Answer</summary>A React hook that reads the value from a React Context — any component can access shared state without prop drilling.</details>

### Q109. What is `useNavigate`?
<details><summary>Answer</summary>A React Router hook that returns a function to programmatically navigate to a different URL — used after form submissions, redirects, or async operations complete.</details>

### Q110. What is `useParams`?
<details><summary>Answer</summary>A React Router hook that reads URL parameters — e.g., for `/interview/:id`, `useParams()` returns `{ id: 'abc123' }`.</details>

### Q111. What is Mongoose?
<details><summary>Answer</summary>An ODM (Object Document Mapper) for MongoDB that adds schema validation, type casting, query helpers, and middleware hooks on top of the native MongoDB driver.</details>

### Q112. What is `express.json()`?
<details><summary>Answer</summary>Built-in Express middleware that parses incoming JSON request bodies and puts the result in `req.body`.</details>

### Q113. What is WebRTC?
<details><summary>Answer</summary>A browser API for real-time peer-to-peer communication (audio, video, data) — Vapi uses it to stream the user's mic audio to their cloud and play back the AI's voice.</details>

### Q114. What is a REST API?
<details><summary>Answer</summary>An API design pattern using standard HTTP methods (GET, POST, PUT, DELETE) on resource URLs (e.g., `/api/interviews`) with stateless request-response cycles and JSON payloads.</details>

### Q115. What is `nodemon`?
<details><summary>Answer</summary>A Node.js development tool that watches for file changes and automatically restarts the server — eliminates manually stopping and restarting after every code change.</details>

### Q116. What is an ObjectId in MongoDB?
<details><summary>Answer</summary>A 12-byte unique identifier auto-generated for every document — composed of a timestamp, machine ID, process ID, and counter to ensure global uniqueness without coordination.</details>

### Q117. What is HMR (Hot Module Replacement)?
<details><summary>Answer</summary>A Vite/Webpack feature that updates changed modules in the browser without a full page reload — preserves React component state during development.</details>

### Q118. What is `dotenv`?
<details><summary>Answer</summary>A Node.js package that reads `.env` files and loads key-value pairs into `process.env` — keeps secrets out of source code.</details>

---

## 27. Advanced Cross-Questions an Interviewer Might Chain

### Q119. 🔥 "You said you use Firebase for auth. But you also use MongoDB. Why not use Firebase's Firestore for everything?"

<details>
<summary>Answer</summary>

I chose MongoDB over Firestore because:

1. **Query flexibility**: Mongoose provides `.find().sort().limit().lean()` with rich query operators (`$push`, `$set`, `$in`). Firestore has more limited querying (no inequality filters on multiple fields without composite indexes, no server-side JOINs).

2. **Atomic array operations**: MongoDB's `$push` atomically appends to arrays. Firestore's `arrayUnion` works similarly but has a 20,000-element limit per document and doesn't preserve insertion order in all cases.

3. **Schema validation**: Mongoose schemas provide application-level type checking, required fields, enums, and defaults. Firestore has Security Rules, but they're for authorization, not data validation.

4. **Cost model**: Firestore charges per document read/write. During a live interview, each transcript save is a write. MongoDB Atlas's pricing is based on cluster size, not per-operation.

5. **Portability**: MongoDB is an open-source database. If I wanted to self-host or switch providers, my code works unchanged. Firestore is proprietary to Google Cloud.

Firebase Auth is still the right choice for authentication because it handles OAuth, password hashing, and session cookies — things I don't want to build myself.
</details>

---

### Q120. 🧠 "You mentioned you'd add TypeScript. What specific bugs would it have caught in this codebase?"

<details>
<summary>Answer</summary>

1. **Typo in property names**: If I typed `feedback.overalScore` instead of `feedback.overallScore`, TypeScript would catch it at compile time. JavaScript would silently return `undefined`.

2. **Wrong function arguments**: `apiPost('/auth/session', { token: idToken })` — the backend expects `idToken`, not `token`. TypeScript interfaces would flag this.

3. **Missing required fields**: `Interview.create({ userId, domain })` — missing `domainLabel`, `domainIcon`, etc. TypeScript would flag the incomplete object.

4. **Incorrect event types**: Vapi's event handler gives different data per event type. TypeScript would enforce that `message.transcript` only exists when `message.type === 'transcript'`.

5. **Component prop mismatches**: Passing `interviewid` instead of `interviewId` to `InterviewPageClient` — TypeScript's prop type checking would catch this.

6. **`null` access without checking**: `domain?.label` — TypeScript would warn if `domain` could be `undefined` and you accessed `.label` without optional chaining.
</details>

---

### Q121. 🧠 "You use `Promise.all` on the dashboard. What if the user has 0 feedbacks? Does the API crash?"

<details>
<summary>Answer</summary>

No. The backend handles this gracefully:

```javascript
// feedbackController.js → getUserFeedbacks
const feedbacks = await Feedback.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
// If no documents match → feedbacks = [] (empty array, not null)

return res.json({ feedbacks }); // Returns { feedbacks: [] }
```

On the frontend:
```javascript
const feedbackData = await apiGet('/feedback/user');
setFeedbacks(feedbackData.feedbacks || []);  // Fallback to [] if undefined

// Stats calculation handles empty array:
const averageScore = feedbacks.length > 0
  ? Math.round(feedbacks.reduce(...) / feedbacks.length)
  : null;  // Shows '—' on the dashboard
```

MongoDB's `find()` always returns an array — if nothing matches the filter, it returns `[]`, not `null` or an error. This is a key design advantage of the query API.
</details>

---

### Q122. "Walk me through what happens in the Express server from the moment a TCP connection is established to when the JSON response is sent."

<details>
<summary>Answer</summary>

1. **TCP connection**: Node.js's `http.Server` (which Express wraps) accepts the TCP connection
2. **HTTP parsing**: Node.js parses the raw TCP bytes into an HTTP request object (`IncomingMessage`)
3. **Express wrapping**: Express wraps it into `req` (with helper methods) and creates `res`
4. **Middleware pipeline starts**:
   - `cors()`: Checks `Origin` header → adds `Access-Control-Allow-*` response headers
   - `cookieParser()`: Parses `Cookie` header → populates `req.cookies`
   - `express.json()`: Reads the request body stream → parses JSON → populates `req.body`
5. **Router matching**: Express matches the URL path and HTTP method to a registered route
6. **Route-level middleware**: e.g., `requireAuth` runs if specified
7. **Controller executes**: Async function runs, queries MongoDB, calls Gemini, etc.
8. **`res.json()` called**:
   - Calls `JSON.stringify()` on the response object
   - Sets `Content-Type: application/json`
   - Sets `Content-Length` header
   - Writes the response body to the TCP socket
9. **Response sent**: Node.js flushes the socket buffer → browser receives the response
10. **Connection**: Stays open for reuse (HTTP/1.1 keep-alive) or closes
</details>

---

### Q123. 🔥 "Your project uses 3 external services: Firebase Auth, Vapi, and Gemini. What's your strategy if any of them has a breaking API change?"

<details>
<summary>Answer</summary>

1. **Pin dependency versions** (`package.json`):
   - `"firebase": "^10.12.5"` — the `^` allows minor updates but not major (10.x.x only)
   - `"@google/genai": "^2.10.0"` — same strategy
   - This prevents automatic breaking upgrades

2. **Abstraction layers**:
   - Firebase Auth is wrapped in `config/firebase.js` and `authController.js` — only these files call Firebase directly
   - Gemini is wrapped in `generateController.js` and `feedbackController.js` — swapping to a different LLM would only change these 2 files
   - Vapi is contained in `InterviewPageClient.jsx` — replacing with a different voice API would only change this one component

3. **Monitoring**:
   - Check changelogs before upgrading
   - Run integration tests after dependency updates
   - Use tools like `npm audit` and Dependabot for security updates

4. **Fallback strategy**: For Gemini specifically, the prompt format and JSON mode are standard patterns that work with most LLM APIs (OpenAI, Anthropic). Switching would require changing the SDK import and the API call format, but not the prompts themselves.
</details>

---

### Q124. 🧠 "If you had to add a feature where interviewers can observe a live interview in real-time, how would you architect it?"

<details>
<summary>Answer</summary>

This requires **real-time bidirectional communication**. Architecture:

1. **WebSocket server** (using Socket.io or `ws`):
   ```javascript
   io.on('connection', (socket) => {
     socket.on('join-interview', (interviewId) => {
       socket.join(`interview:${interviewId}`);
     });
   });
   ```

2. **Transcript broadcasting**: When `addEntry` saves a transcript entry, also emit it via WebSocket:
   ```javascript
   // In transcriptController.js:
   io.to(`interview:${interviewId}`).emit('new-transcript', entry);
   ```

3. **Observer frontend**: A read-only version of `InterviewPageClient` that:
   - Connects to the WebSocket room for the interview ID
   - Listens for `new-transcript` events
   - Renders the transcript in real-time
   - Shows speaking/listening indicators

4. **Access control**: Only allow observers with the correct permissions (e.g., a shareable link with an observer token)

5. **Scaling**: If multiple servers, use **Redis Pub/Sub** as the Socket.io adapter so all server instances share the same event bus:
   ```javascript
   import { createAdapter } from '@socket.io/redis-adapter';
   io.adapter(createAdapter(pubClient, subClient));
   ```
</details>

---

### Q125. 🔥 "Compare REST vs GraphQL. Why did you choose REST for this project?"

<details>
<summary>Answer</summary>

| Aspect | REST (VoxTutor's choice) | GraphQL |
|--------|------------------------|---------|
| **Simplicity** | Simple URL-based routing | Query language adds complexity |
| **Over-fetching** | Possible (e.g., fetching full interview when only need status) | Client specifies exactly what fields it needs |
| **Under-fetching** | Possible (dashboard needs 2 calls: interviews + feedbacks) | Single query can fetch both with nesting |
| **Caching** | HTTP caching works natively (URL-based) | Requires specialized caching (Apollo, Relay) |
| **File uploads** | Standard multipart/form-data | Requires additional setup |
| **Learning curve** | Low (everyone knows HTTP verbs) | Higher (schema definition, resolvers, query language) |

**Why REST was right here**:
- Only 13 endpoints — not enough complexity to justify GraphQL overhead
- No deeply nested data relationships that would cause N+1 queries
- Standard CRUD operations map cleanly to HTTP verbs
- The team size is 1 (me) — GraphQL's benefits shine in larger teams with different frontend/backend developers

**When I'd switch to GraphQL**:
- If the frontend needed different subsets of data on different pages (customizable queries)
- If there were complex data relationships (users → interviews → feedback → categories → nested objects)
- If multiple frontend clients (web, mobile, admin) needed different views of the same data
</details>

---

## 28. Trick Questions & Common Misconceptions

### Q126. "Is React a framework or a library?"

<details>
<summary>Answer</summary>

**React is a library**, not a framework.

- A **library** provides tools you call when you need them (you control the flow)
- A **framework** controls the flow and calls your code (Inversion of Control)

React only handles the **view layer** (rendering UI from state). For everything else, you choose your own tools:
- Routing → React Router (not built-in)
- State management → Context API, Redux, Zustand (not built-in)
- Data fetching → fetch, Axios, React Query (not built-in)
- Styling → CSS, Tailwind, styled-components (not built-in)

**Next.js** is a framework built on top of React — it provides routing, SSR, API routes, and build configuration out-of-the-box.
</details>

---

### Q127. "Is MongoDB a NoSQL database? What does NoSQL even mean?"

<details>
<summary>Answer</summary>

Yes, MongoDB is a **NoSQL** (Not Only SQL) database, specifically a **document database**.

NoSQL is an umbrella term for databases that don't use traditional relational tables:

| Type | Example | Data Model |
|------|---------|-----------|
| **Document** | MongoDB, Firestore | JSON-like documents with flexible schemas |
| **Key-Value** | Redis, DynamoDB | Simple key → value pairs |
| **Column-Family** | Cassandra, HBase | Rows with dynamic columns |
| **Graph** | Neo4j, Amazon Neptune | Nodes and edges (relationships) |

**MongoDB specifically**:
- Stores data as BSON (Binary JSON) documents
- Schema-flexible (each document can have different fields)
- No JOINs needed (related data is embedded or referenced)
- Horizontal scaling via sharding
- Trade-off: no ACID transactions across collections by default (though MongoDB 4.0+ supports multi-document transactions)
</details>

---

### Q128. 🧠 "You said cookies are `httpOnly`. Does that mean the server can't read them either?"

<details>
<summary>Answer</summary>

No — `httpOnly` only restricts **client-side JavaScript** from reading the cookie. The server can always read cookies because they're sent in the `Cookie` HTTP header with every request.

| Who | Can read `httpOnly` cookie? |
|-----|:--:|
| Browser JavaScript (`document.cookie`) | ❌ |
| Server (Express `req.cookies`) | ✅ |
| Browser DevTools (Application → Cookies) | ✅ (for debugging) |
| Network interceptor (Wireshark, if HTTP) | ✅ (that's why `secure` + HTTPS is also needed) |

`httpOnly` protects against **XSS attacks** — if an attacker injects JavaScript into the page, they can't read the session cookie and send it to their server. But the cookie is still sent with every HTTP request to the matching domain.
</details>

---

### Q129. "What's the difference between authentication and authorization?"

<details>
<summary>Answer</summary>

| Concept | Question It Answers | VoxTutor Example |
|---------|-------------------|-----------------|
| **Authentication** | "Who are you?" | Firebase verifies email/password → confirms identity |
| **Authorization** | "Are you allowed to do this?" | `requireAuth` middleware checks if the user has a valid session before allowing access to protected routes |

In VoxTutor:
- **Authentication** happens during sign-in: Firebase verifies credentials → backend creates a session cookie
- **Authorization** happens on every protected request: `requireAuth` verifies the cookie → looks up the user → attaches `req.user`

**Missing authorization**: The app authenticates users but doesn't fully authorize actions. For example, any authenticated user could theoretically access another user's interview via `GET /api/interviews/:id` because that endpoint doesn't check ownership.
</details>

---

### Q130. 🔥 "Explain the difference between `var`, `let`, and `const`. Which do you use?"

<details>
<summary>Answer</summary>

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| **Scope** | Function-scoped | Block-scoped | Block-scoped |
| **Hoisting** | Hoisted + initialized as `undefined` | Hoisted but NOT initialized (TDZ) | Hoisted but NOT initialized (TDZ) |
| **Reassignment** | ✅ | ✅ | ❌ |
| **Re-declaration** | ✅ (silently) | ❌ (error) | ❌ (error) |

**In VoxTutor, I use:**
- `const` for everything by default (variables, functions, imports)
- `let` only when the value needs to change (e.g., `let isMounted = true` in `useEffect`)
- `var` — never. It has function-level scoping which leads to bugs:
  ```javascript
  for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }
  // Prints: 3, 3, 3 (var is function-scoped, shared across iterations)
  
  for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }
  // Prints: 0, 1, 2 (let is block-scoped, each iteration gets its own copy)
  ```
</details>

---

## 29. Final Boss — Multi-Part Scenario Questions

### Q131. 🔥 "Design a feature: Allow users to share their feedback report via a public link. Walk me through the full implementation."

<details>
<summary>Answer</summary>

**Requirements**: Users can click "Share" on their feedback report to get a public URL. Anyone with the link can view the report (no login needed).

**Implementation Plan:**

1. **Generate a share token** (backend):
   ```javascript
   import crypto from 'crypto';
   
   const shareToken = crypto.randomBytes(16).toString('hex'); // e.g., "a3f2b9c1..."
   await Interview.findByIdAndUpdate(interviewId, { shareToken });
   ```

2. **New API endpoint**: `GET /api/feedback/shared/:token`
   ```javascript
   router.get('/shared/:token', async (req, res) => {
     const interview = await Interview.findOne({ shareToken: req.params.token }).lean();
     if (!interview) return res.status(404).json({ error: 'Not found' });
     const feedback = await Feedback.findOne({ interviewId: interview._id }).lean();
     return res.json({ interview, feedback });
   });
   ```
   No authentication required — the token IS the authorization.

3. **New frontend route**: `/shared/:token` → `SharedFeedbackPage`
   - Reuses the same visual components from `FeedbackPage`
   - No navbar (public page)
   - "Sign up to try VoxTutor" CTA at the bottom

4. **Share button on FeedbackPage**:
   ```javascript
   async function handleShare() {
     const res = await apiPost(`/feedback/${interviewId}/share`);
     const { shareUrl } = await res.json();
     navigator.clipboard.writeText(shareUrl);
     // Show "Link copied!" toast
   }
   ```

5. **Security considerations**:
   - Token is unguessable (128-bit random = 3.4 × 10^38 combinations)
   - Add rate limiting on the public endpoint
   - Allow users to revoke share links (set `shareToken: null`)
   - Don't expose sensitive fields (user email, UID) in the shared response
</details>

---

### Q132. 🧠 "The product team wants to add a 'Practice with a friend' feature where two users interview each other. How would you redesign the architecture?"

<details>
<summary>Answer</summary>

**Core change**: Replace AI-to-user with user-to-user real-time communication.

**Architecture:**

1. **WebSocket server** (Socket.io): For signaling between two users
   ```
   User A (Interviewer) ←→ WebSocket Server ←→ User B (Candidate)
   ```

2. **Room system**: Create a room when User A invites User B
   ```javascript
   io.on('connection', (socket) => {
     socket.on('create-room', () => {
       const roomId = generateId();
       socket.join(roomId);
       socket.emit('room-created', { roomId, inviteLink: `/join/${roomId}` });
     });
     socket.on('join-room', (roomId) => {
       socket.join(roomId);
       io.to(roomId).emit('partner-joined');
     });
   });
   ```

3. **WebRTC peer-to-peer audio**: Use the browser's WebRTC API directly (no Vapi needed):
   - Socket.io handles signaling (SDP offer/answer, ICE candidates)
   - Audio streams directly between browsers (lower latency, free)

4. **Role assignment**: User A is the interviewer, User B is the candidate (swappable)

5. **Transcript**: Use browser's `SpeechRecognition` API to transcribe both users locally, then sync via WebSocket

6. **Feedback**: After the session, User A provides manual feedback OR the transcript is sent to Gemini for AI feedback

**New database models:**
```javascript
// PracticeSession
{
  interviewerUserId: String,
  candidateUserId: String,
  roomId: String,
  transcript: [{ role, content, timestamp }],
  status: 'waiting' | 'active' | 'completed',
}
```

**Challenges:**
- NAT traversal (WebRTC needs TURN/STUN servers for users behind firewalls)
- Browser `SpeechRecognition` accuracy varies
- Synchronizing transcript between two clients
- Handling one user disconnecting mid-session
</details>

---

### Q133. 🔥 "Your project stores all data in a single MongoDB cluster. Design a disaster recovery plan."

<details>
<summary>Answer</summary>

**1. Backup Strategy:**
- **Automated backups**: MongoDB Atlas provides continuous backups with point-in-time recovery (last 7 days)
- **Daily snapshots**: Schedule daily snapshots retained for 30 days
- **Cross-region replication**: Deploy a replica set across 2+ regions (e.g., us-east-1 + eu-west-1)

**2. Recovery Scenarios:**

| Scenario | RTO (Recovery Time) | RPO (Data Loss) | Strategy |
|----------|:--:|:--:|----------|
| Accidental document deletion | Minutes | 0 | Point-in-time recovery |
| Single node failure | 0 (automatic) | 0 | Replica set auto-failover |
| Region outage | Minutes | 0 | Cross-region replica takes over |
| Data corruption | Minutes | Up to last snapshot | Restore from daily snapshot |
| Complete cluster loss | ~30 min | Up to 24h | Restore from offsite backup |

**3. Application-Level Resilience:**
- **Read preference**: `secondaryPreferred` — reads can go to replicas, so reads survive primary failure
- **Write concern**: `w: 'majority'` — writes must be confirmed by majority of replica set before returning success
- **Connection retry**: Mongoose has built-in `serverSelectionTimeoutMS` and retry logic

**4. Testing:**
- Quarterly disaster recovery drills
- Test backup restoration to a staging cluster
- Simulate region failure and verify failover
</details>

---

> **Final Interview Tip**: Don't just memorize answers. Understand the **reasoning** behind each decision. When an interviewer asks "why X?", they want to hear trade-offs: "I chose X over Y because of A and B, but the downside is C, which I'd address in production by D."
