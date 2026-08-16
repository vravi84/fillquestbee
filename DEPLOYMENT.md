# 🚀 Production Deployment Guide — FillQuestBee (fillquestbee.com)

This document provides step-by-step instructions for deploying **FillQuestBee** (`fillquestbee.com`) to **Firebase App Hosting**.

---

## 📋 Prerequisites & Tools

Ensure you have the following installed on your machine:
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Firebase CLI**: `firebase-tools` v15.24.0 or higher

---

## 🛠️ Step 1: Firebase CLI & Login

Check Firebase CLI version:

```bash
firebase --version
```

If outdated, update to latest:

```bash
npm install -g firebase-tools@latest
```

Authenticate with your Firebase account:

```bash
firebase login
```

---

## 🎯 Step 2: Firebase Project Selection

List all your accessible Firebase projects:

```bash
firebase projects:list
```

Select your existing CDF Firebase project:

```bash
firebase use YOUR_PROJECT_ID
```

*(Replace `YOUR_PROJECT_ID` with your actual project ID, e.g., `cdf-app`).*

---

## 🔒 Step 3: Deploy Firestore Security Rules

Verify that `firestore.rules` is configured in `firebase.json`:

```bash
firebase deploy --only firestore:rules
```

> [!IMPORTANT]
> This command safely deploys the application's Firestore security rules without touching database data or other project resources.

---

## 🌐 Step 4: Environment Variables & Secret Configuration

The application separates public client configuration from server-side secrets.

### Client-Safe Environment Variables (Set in Firebase App Hosting Console)

These values are safe to expose to client browsers and can be configured as environment variables in the App Hosting Backend configuration:

| Variable Name | Purpose | Example / Format |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `cdf-app.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `cdf-app` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `cdf-app.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | `1234567890` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:1234567890:web:...` |

---

### Server-Only Secrets (Store in Google Cloud Secret Manager)

These keys **MUST NEVER** be exposed to the browser or prefixed with `NEXT_PUBLIC_`. In Firebase App Hosting, store these in **Google Cloud Secret Manager** and bind them in `apphosting.yaml`:

| Secret Name | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for server-side AI content extraction & MCQ generation |
| `FIREBASE_PROJECT_ID` | Firebase Project ID for Admin SDK server initialization |
| `FIREBASE_CLIENT_EMAIL` | Service account client email (e.g. `firebase-adminsdk-xxx@...`) |
| `FIREBASE_PRIVATE_KEY` | Service account private key (`-----BEGIN PRIVATE KEY-----\n...`) |
| `INITIAL_ADMIN_EMAIL` | Email address of the primary administrator for initial bootstrapping |

To create secrets in Secret Manager via Google Cloud Console or gcloud CLI:

```bash
# Example using gcloud CLI:
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

gcloud secrets create FIREBASE_PROJECT_ID --replication-policy="automatic"
echo -n "YOUR_PROJECT_ID" | gcloud secrets versions add FIREBASE_PROJECT_ID --data-file=-

gcloud secrets create FIREBASE_CLIENT_EMAIL --replication-policy="automatic"
echo -n "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com" | gcloud secrets versions add FIREBASE_CLIENT_EMAIL --data-file=-

gcloud secrets create FIREBASE_PRIVATE_KEY --replication-policy="automatic"
echo -n "-----BEGIN PRIVATE KEY-----\n..." | gcloud secrets versions add FIREBASE_PRIVATE_KEY --data-file=-
```

---

## ⚡ Step 5: Initialize & Deploy to Firebase App Hosting

### 1. App Hosting Initialization (First Time Only)

Run the App Hosting wizard:

```bash
firebase init apphosting
```

Follow the prompts:
- **Select existing project**: Choose your active project ID.
- **Application Root**: Keep root (`./`).
- **Backend ID**: Use `cdf-app`.

### 2. Deploy to Production

Deploy your application backend to App Hosting:

```bash
firebase deploy --only apphosting:cdf-app
```

Firebase App Hosting will clone your repository / upload your project build context, install dependencies, run `npm run build` using Node.js 20, bind the Secret Manager secrets, and launch the server.

---

## 🔑 Step 6: First Admin Bootstrap

After deploying to production and setting up Firebase Authentication:

1. Sign up the primary administrator account (email/password or Google) through the live application `/admin/login` or `/teacher/register`.
2. Run the secure server-side bootstrap script locally with production environment variables set:

```bash
npm run bootstrap-admin admin@school.edu
```

This securely assigns the `{ admin: true }` custom claim to the account via Firebase Admin SDK.

---

## 🧪 Step 7: Local & Production Testing Checklist

### Local Validation
```bash
# Install dependencies
npm install

# Test production build
npm run build

# Run local production preview server
npm run start
```

### Production Security Verification
- [ ] **Unauthenticated Admin API Call**: `GET /api/admin/teachers` without token returns `401 Unauthorized`.
- [ ] **Non-Admin User Admin Access**: Requesting `/api/admin/*` with normal teacher token returns `403 Forbidden`.
- [ ] **Pending Teacher AI Access**: Requesting `/api/ai/extract-content` or `/api/ai/generate-mcq` as a pending/suspended teacher returns `403 Forbidden` and does **NOT** invoke Gemini API.
- [ ] **Approved Teacher AI Access**: Requesting `/api/ai/*` as an approved teacher returns `200 OK` and generates MCQ/content.
- [ ] **Student Access**: Opening `/exam/[examId]` requires no login, allows drag & drop, triggers celebration on correct drop, and saves attempt in Firestore.

---

## ❓ Step 8: Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| Build fails on App Hosting | Missing Node engine specification | Ensure `package.json` contains `"engines": { "node": "^20" }` |
| `401 Unauthorized` on Admin API | Missing `Bearer` token header | Ensure client passes Firebase ID token in `Authorization` header |
| `500 Server Error` on AI API | Missing `GEMINI_API_KEY` | Verify `GEMINI_API_KEY` secret is bound in `apphosting.yaml` and created in Secret Manager |
| `403 Forbidden` on Admin login | Custom claim missing | Run `npm run bootstrap-admin <email>` to set `{ admin: true }` claim |
