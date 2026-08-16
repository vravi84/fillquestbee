/**
 * FIRST ADMIN BOOTSTRAP SCRIPT
 * 
 * Usage:
 *   node scripts/bootstrap-admin.js [admin_email]
 * 
 * Alternatively reads from environment variable:
 *   INITIAL_ADMIN_EMAIL=admin@school.edu
 * 
 * Securely assigns the `admin: true` custom claim via Firebase Admin SDK
 * and sets the Firestore user profile to { role: 'admin', status: 'active' }.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const admin = require('firebase-admin');

const targetEmail = process.argv[2] || process.env.INITIAL_ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAILS;

console.log('====================================================');
console.log('   CDF PRACTICE STUDIO — SECURE FIRST ADMIN BOOTSTRAP');
console.log('====================================================');

if (!targetEmail) {
  console.error('ERROR: No admin email provided.');
  console.error('Please specify an email address as argument or set INITIAL_ADMIN_EMAIL in .env.local');
  console.error('Example: node scripts/bootstrap-admin.js admin@school.edu');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!projectId) {
  console.error('ERROR: FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID must be set in environment.');
  process.exit(1);
}

// Initialize Admin SDK
let app;
try {
  if (clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    app = admin.initializeApp({ projectId });
  }
} catch (e) {
  console.error('Failed to initialize Firebase Admin SDK:', e.message);
  process.exit(1);
}

const auth = admin.auth(app);
const db = admin.firestore(app);

async function bootstrapAdmin() {
  console.log(`Searching for user with email: ${targetEmail}...`);
  try {
    const user = await auth.getUserByEmail(targetEmail);
    console.log(`User found! UID: ${user.uid}`);

    // Assign admin custom claim
    console.log('Setting Firebase Auth custom claim { admin: true }...');
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: true,
      role: 'admin',
    });
    console.log('✔ Admin custom claim successfully set!');

    // Create / Update Firestore user document
    console.log('Updating Firestore user document...');
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set(
      {
        uid: user.uid,
        name: user.displayName || targetEmail.split('@')[0] || 'Administrator',
        email: targetEmail,
        role: 'admin',
        status: 'active',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✔ Firestore user profile updated to role: "admin", status: "active"!');
    console.log('');
    console.log('====================================================');
    console.log('🎉 SUCCESS: Admin account bootstrapped successfully!');
    console.log(`Admin Email: ${targetEmail}`);
    console.log('The user can now sign in at /admin/login');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`ERROR: No user found with email "${targetEmail}" in Firebase Authentication.`);
      console.error('The admin must first register or log in once via email/password or Google before bootstrapping.');
    } else {
      console.error('ERROR during bootstrap:', error.message || error);
    }
    process.exit(1);
  }
}

bootstrapAdmin();
