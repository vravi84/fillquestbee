# 🚀 FillQuestBee — AI Interactive Exam Web Application (fillquestbee.com)

An interactive, responsive, child-friendly web application at **[fillquestbee.com](https://fillquestbee.com)** where teachers can create interactive **fill-in-the-blank / drag-and-drop exams** from educational content using **Google Gemini AI** and **Firebase**.

---

## ✨ Key Features

### 👩‍🏫 Teacher Portal
- **Authentication**: Professional Firebase Email/Password auth system with demo mode fallback.
- **Dashboard**: Metric cards (Total Exams, Published Exams, Total Attempts, Class Average Score) and exam management table.
- **Step-by-Step Exam Creator Wizard**:
  1. **Basic Info**: Exam Title, Class (Class 1 to Class 12), Subject, Topic, Question Count (10 to 15).
  2. **Content Ingestion**: Ingest lesson text, textbook page images (JPG, PNG, WEBP), and PDF documents with future-ready DOCX/URL tab structure.
  3. **AI Sentence Extraction**: Gemini AI analyzes content and extracts 10–15 factual educational statements.
  4. **Interactive Blank Selector (Core Feature)**: Word-by-word interactive selector allowing teachers to click words/phrases to convert into target blanks (`The SI unit of [force] is Newton.` → `The SI unit of ______ is Newton.`).
  5. **AI MCQ Distractor Generation**: Gemini AI populates 3 plausible conceptual distractors, correct answer, and concept explanation with Zod schema validation.
  6. **Teacher Question Review Stage**: Full editing capabilities for sentences, blanks, options (A,B,C,D), correct answer, explanations, question reordering, and live student preview.
  7. **Publish & Share**: Generates unique share codes (`CDF-8F4K92`), shareable URL (`/exam/[examId]`), Web Share API, and Copy Link.
- **Analytics & Results**: Student submission breakdown (Score, Percentage, Time Taken, Completion Date), attempt modal detail view, individual attempt deletion, and **Export Results as CSV**.

### 🎒 Student Experience
- **No Account Required**: Direct link access (`/exam/[examId]`). Student enters name to start.
- **Interactive Drag & Drop**: Powered by `@dnd-kit/core` with prominent drop targets (`[ Drop Answer Here ]`), active drop highlights, and accessible touch/tap-to-select fallback for tablets and mobile devices.
- **Real-Time Visual Feedback**:
  - **Correct Drop**: Confetti burst (`canvas-confetti`), celebration badge, green glowing drop zone, explanation, and "Next Question →".
  - **Wrong Drop**: Friendly encouragement ("Almost! Try again 😊"), gentle shake animation, option card returns to bank for retry.
- **Score & Practice Mode**: Score card (`8/10`, `80%`), performance star rating (⭐⭐⭐⭐), score-tailored encouragement message, question review breakdown, and "Try Again 🔄" (reshuffles questions & distractors).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Animations & Effects**: `framer-motion`, `canvas-confetti`
- **Backend / Database**: Firebase (Auth, Cloud Firestore, Firebase Storage)
- **AI**: Google Gemini API (`@google/genai`)

---

## ⚙️ Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your secrets:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note**: If environment keys are not configured, the application automatically engages a **resilient local fallback engine** (Demo Auth & LocalStorage / Smart Distractor Generator) so the application works out of the box!

---

## 💻 Local Development

Run the following commands:

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Open browser at http://localhost:3000
```

To test production build:

```bash
npm run build
npm run start
```

---

## 🔒 Security Rules

### Firestore (`firestore.rules`)
- `users`: Teachers can read/write their own user document.
- `exams`: Anyone can read published exams to take tests. Authenticated teachers can create, edit, and delete their own exams.
- `attempts`: Anyone can submit student exam attempts. Authenticated teachers can read and delete attempts.

### Firebase Storage (`storage.rules`)
- Uploads scoped to `/exam-content/{teacherId}/{examId}/...`. Only authenticated teachers can write to their own path.

---

## 🚀 Production Deployment (Firebase App Hosting)

### 1. Firebase CLI Setup & Project Selection
```bash
# Check Firebase CLI version
firebase --version

# Authenticate with Firebase
firebase login

# List projects and select your active project
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### 2. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Deploy to Firebase App Hosting
```bash
# Initialize App Hosting (first time setup)
firebase init apphosting

# Deploy backend
firebase deploy --only apphosting:cdf-app
```

> [!NOTE]
> For complete instructions on environment variables, Google Cloud Secret Manager configuration, and first admin account setup, see [DEPLOYMENT.md](file:///d:/SCHOOL%20PROJECTS/CDFPRACTICE/DEPLOYMENT.md).

