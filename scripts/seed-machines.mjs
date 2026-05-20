/**
 * RoboFab Machine Fleet — CLI Seed Script
 *
 * SETUP (one-time):
 *   npm install -D firebase-admin
 *
 * CONFIGURE:
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save the JSON as: scripts/serviceAccount.json   (never commit this file)
 *   3. Add the following to .gitignore:
 *        scripts/serviceAccount.json
 *
 * RUN:
 *   npm run seed              # seeds only if machines collection is empty
 *   npm run seed -- --force   # deletes existing machines and re-creates all
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Machine fleet data ───────────────────────────────────────────────────────

const ROBOFAB_MACHINES = [
  { name: 'Centuri 1',       type: '3D Printer', status: 'active', notes: 'Centuri series — طابعة الإنتاج' },
  { name: 'Neptune Plus',    type: '3D Printer', status: 'active', notes: 'Elegoo Neptune Plus' },
  { name: 'Kobra 2 Pro',     type: '3D Printer', status: 'active', notes: 'Anycubic Kobra 2 Pro — طباعة عالية السرعة' },
  { name: 'Neptune Max 1',   type: '3D Printer', status: 'active', notes: 'Elegoo Neptune Max — وحدة 1' },
  { name: 'Neptune Max 2',   type: '3D Printer', status: 'active', notes: 'Elegoo Neptune Max — وحدة 2' },
  { name: 'Neptune Max 3',   type: '3D Printer', status: 'active', notes: 'Elegoo Neptune Max — وحدة 3' },
  { name: 'Neptune Max 4',   type: '3D Printer', status: 'active', notes: 'Elegoo Neptune Max — وحدة 4' },
  { name: 'Anycubic Max 3',  type: '3D Printer', status: 'active', notes: 'Anycubic Kobra Max 3' },
  { name: 'Ender 3 Max Neo', type: '3D Printer', status: 'active', notes: 'Creality Ender 3 Max Neo' },
  { name: 'Neptune 3 Pro',   type: '3D Printer', status: 'active', notes: 'Elegoo Neptune 3 Pro' },
  { name: 'Anker',           type: '3D Printer', status: 'active', notes: 'Anker Make M5' },
];

// ─── Init firebase-admin ──────────────────────────────────────────────────────

const serviceAccountPath = join(__dirname, 'serviceAccount.json');

if (!existsSync(serviceAccountPath)) {
  console.error('\n❌  serviceAccount.json not found at:', serviceAccountPath);
  console.error('\nTo fix:');
  console.error('  1. Firebase Console → Project Settings → Service Accounts');
  console.error('  2. Click "Generate new private key" → save as scripts/serviceAccount.json');
  console.error('  3. Run this script again.\n');
  process.exit(1);
}

let admin;
try {
  admin = require('firebase-admin');
} catch {
  console.error('\n❌  firebase-admin is not installed.');
  console.error('    Run: npm install -D firebase-admin\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function seedIfEmpty() {
  const snap = await db.collection('machines').limit(1).get();

  if (!snap.empty) {
    const count = (await db.collection('machines').get()).size;
    console.log(`ℹ️  machines collection already has ${count} document(s). Skipping.`);
    console.log('   Use --force flag to replace all machines.');
    return;
  }

  await insertMachines();
}

async function forceReseed() {
  console.log('⚠️  Force mode: deleting existing machines...');
  const existing = await db.collection('machines').get();

  if (!existing.empty) {
    const deleteBatch = db.batch();
    existing.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
    console.log(`   Deleted ${existing.size} existing machine(s).`);
  }

  await insertMachines();
}

async function insertMachines() {
  const now = new Date().toISOString();
  const batch = db.batch();

  for (const machine of ROBOFAB_MACHINES) {
    const ref = db.collection('machines').doc();
    batch.set(ref, { ...machine, createdAt: now, updatedAt: now });
  }

  await batch.commit();
  console.log(`\n✅  Seeded ${ROBOFAB_MACHINES.length} machines:\n`);
  ROBOFAB_MACHINES.forEach((m, i) => {
    console.log(`   ${String(i + 1).padStart(2, '0')}. ${m.name}`);
  });
  console.log('');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const force = process.argv.includes('--force');

console.log('\n🚀  RoboFab Machine Fleet Seed Script');
console.log(`   Project: ${serviceAccount.project_id}`);
console.log(`   Mode: ${force ? 'FORCE RESEED' : 'seed if empty'}\n`);

try {
  if (force) {
    await forceReseed();
  } else {
    await seedIfEmpty();
  }
  process.exit(0);
} catch (err) {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
}
