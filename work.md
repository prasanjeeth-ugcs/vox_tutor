# VoxTutor — How to Run

## Prerequisites

Before running VoxTutor, make sure you have:

- **Node.js** v18 or higher installed → [Download](https://nodejs.org)
- **npm** (comes bundled with Node.js)
- A **Firebase** project with Firestore and Authentication enabled
- A **Google Gemini** API key
- A **Vapi** account with an assistant configured

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Vox-Tutor-main
```

---

## Step 2: Install Dependencies

```bash
# Install root dependencies (concurrently — runs both servers)
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Go back to root
cd ..
```

Or use the shortcut:

```bash
npm install
npm run install:all
```

---

## Step 3: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

### Vapi Keys (Voice Interview)
```
VITE_VAPI_KEY=vapi_pub_xxxxxxxx          ← From dashboard.vapi.ai → Account → Public Key
VITE_VAPI_ASSISTANT_ID=your-assistant-id  ← From Vapi dashboard → Assistants → Your assistant ID
```

### Gemini Key (AI Question & Feedback Generation)
```
GEMINI_API_KEY=AIzaxxxxxxxx              ← From aistudio.google.com → Get API Key
```

### Firebase Client Keys (Frontend — safe to expose)
```
VITE_FIREBASE_API_KEY=AIzaxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxx
```

> **Where to find these**: Firebase Console → Project Settings → Your apps → Web app → Config

### Firebase Admin Keys (Backend — keep secret)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxxxxx\n-----END PRIVATE KEY-----\n"
```

> **Where to find these**: Firebase Console → Project Settings → Service accounts → Generate new private key (download the JSON, copy values from it)

### Backend Config
```
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## Step 4: Set Up Firebase

### 4a. Enable Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**
3. Enable **Google** (set your support email)

### 4b. Create Firestore Database
1. Go to Firebase Console → Firestore Database → Create database
2. Start in **test mode** (or deploy the security rules below)
3. Choose your preferred region

### 4c. Deploy Security Rules (Optional but recommended)
The file `firestore.rules` in the project root contains the security rules. Deploy them:

```bash
# If you have Firebase CLI installed
firebase deploy --only firestore:rules
```

### 4d. Create Firestore Indexes
Firestore needs composite indexes for the queries used. When you first run the app and encounter an index error, Firebase will provide a direct link to create the required index. The two indexes needed are:

| Collection   | Fields                              |
|-------------|--------------------------------------|
| interviews  | `userId` (Ascending), `createdAt` (Descending) |
| feedback    | `userId` (Ascending), `createdAt` (Descending) |

---

## Step 5: Set Up Vapi Assistant

1. Go to [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Create a new **Assistant**
3. Configure the voice (e.g., ElevenLabs voice)
4. Copy the **Assistant ID** into your `.env.local` as `VITE_VAPI_ASSISTANT_ID`
5. Copy your **Public Key** as `VITE_VAPI_KEY`

---

## Step 6: Run the App

```bash
npm run dev
```

This starts both servers simultaneously:

| Server   | URL                        | Purpose           |
|----------|----------------------------|--------------------|
| Frontend | http://localhost:5173      | React UI (Vite)    |
| Backend  | http://localhost:5000      | Express API        |

Open **http://localhost:5173** in your browser to use VoxTutor.

---

## Other Commands

| Command              | What it does                                |
|----------------------|---------------------------------------------|
| `npm run dev`        | Start both frontend and backend             |
| `npm run dev:frontend` | Start only the frontend                   |
| `npm run dev:backend`  | Start only the backend                    |
| `npm run build`      | Build the frontend for production           |

---

## Troubleshooting

### "Script execution is disabled" on Windows
```bash
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### Firebase "Missing or insufficient permissions"
- Make sure your Firestore rules are deployed
- Make sure the user is signed in before accessing protected data

### Vapi "401 Unauthorized"
- Double-check `VITE_VAPI_KEY` in `.env.local`
- Make sure the key starts with `vapi_pub_`

### "Microphone access denied"
- Allow microphone permission in your browser when prompted
- If using Chrome, click the lock icon in the address bar → Site settings → Microphone → Allow

### Build fails with module errors
```bash
cd frontend && npm install
cd ../backend && npm install
```
