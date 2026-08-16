/**
 * FIRST ADMIN SETUP SCRIPT
 * 
 * Usage:
 *   node scripts/create-admin.js <user_email>
 * 
 * Example:
 *   node scripts/create-admin.js admin@school.edu
 * 
 * This script documents how project owners can securely grant admin privileges
 * to a designated user account in Firestore.
 */

const fs = require('fs');
const path = require('path');

const targetEmail = process.argv[2] || 'admin@school.edu';

console.log('====================================================');
console.log('   CDF PRACTICE STUDIO — FIRST ADMIN BOOTSTRAP      ');
console.log('====================================================');
console.log(`Target Admin Email: ${targetEmail}`);
console.log('');
console.log('To set up your first admin in Firebase:');
console.log('1. Open Firebase Console -> Firestore Database -> users collection.');
console.log(`2. Locate or create the document for email: "${targetEmail}".`);
console.log('3. Set the following fields:');
console.log('     role: "admin"');
console.log('     status: "active"');
console.log('');
console.log('Or use the built-in development admin shortcut:');
console.log('   Email: admin@school.edu');
console.log('   Click "Login as Demo Administrator" on /admin/login');
console.log('====================================================');
