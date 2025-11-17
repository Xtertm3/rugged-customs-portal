/**
 * Clean Firestore script
 * Purpose: Delete all root collections/documents except a configurable preserve list (e.g. `teamMembers`).
 * WARNING: This is destructive. Run with DRY_RUN=1 first to preview deletions.
 * Usage (PowerShell):
 *   $env:DRY_RUN='1'; node scripts/clean_firestore.js
 *   # If OK, run actual deletion:
 *   node scripts/clean_firestore.js
 *
 * Uses Firebase client SDK with your existing .env configuration.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch, query, limit as firestoreLimit } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// Collections to preserve completely
const PRESERVE_COLLECTIONS = [
  'teamMembers',
  // if you store admins in a separate collection add it here
  // 'sites' is NOT included here, so it will be deleted
];

// If you want to preserve only specific docs in a collection, list as { collection: 'xyz', keepIds: ['id1','id2'] }
const PRESERVE_DOCS = [
  // example: { collection: 'teamMembers', keepIds: ['admin'] }
];

const BATCH_SIZE = 500;

// Known root collections in your app
const KNOWN_COLLECTIONS = [
  'teamMembers',
  'sites',
  'paymentRequests',
  'inventory',
  'materialUsageLogs',
  'transporters',
  'jobCards'
];

async function countDocuments(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.size;
}

async function deleteCollection(collectionPath) {
  console.log(`\n>> Deleting collection: ${collectionPath}`);
  let totalDeleted = 0;

  const preserveDocEntry = PRESERVE_DOCS.find(p => p.collection === collectionPath);
  const keepIds = preserveDocEntry ? new Set(preserveDocEntry.keepIds || []) : null;

  while (true) {
    const q = query(collection(db, collectionPath), firestoreLimit(BATCH_SIZE));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) break;

    const batch = writeBatch(db);
    let batchCount = 0;
    
    for (const document of snapshot.docs) {
      if (keepIds && keepIds.has(document.id)) {
        continue; // skip
      }
      
      batch.delete(doc(db, collectionPath, document.id));
      batchCount++;
    }

    if (batchCount === 0) break;

    if (DRY_RUN) {
      console.log(`  [dry-run] would delete ${batchCount} documents from ${collectionPath}`);
      totalDeleted += batchCount;
      // In dry-run, just count all and break
      const allDocs = await getDocs(collection(db, collectionPath));
      totalDeleted = allDocs.size - (keepIds ? keepIds.size : 0);
      break;
    } else {
      await batch.commit();
      totalDeleted += batchCount;
      console.log(`  deleted ${batchCount}, total ${totalDeleted}`);
    }
  }

  console.log(`>> Finished collection ${collectionPath}. Total deleted: ${totalDeleted}`);
  return totalDeleted;
}

async function deleteStorageForCollection(collectionName) {
  if (!storage) {
    console.log('Storage not initialized or admin SDK without storage, skipping storage cleanup');
    return 0;
  }

  // This is app-specific. Implement if your attachments are stored with predictable prefixes.
  console.log(`Storage cleanup not implemented automatically. If needed, add logic to delete files under the desired prefixes.`);
  return 0;
}

(async () => {
  console.log('Starting cleanup script. DRY_RUN =', DRY_RUN);

  console.log('Known collections:', KNOWN_COLLECTIONS.join(', '));

  const toDelete = KNOWN_COLLECTIONS.filter(c => !PRESERVE_COLLECTIONS.includes(c));
  if (toDelete.length === 0) {
    console.log('Nothing to delete. Exiting.');
    process.exit(0);
  }

  console.log('Collections that will be deleted:', toDelete.join(', '));
  console.log('Collections that will be preserved:', PRESERVE_COLLECTIONS.join(', '));

  if (DRY_RUN) console.log('\n*** DRY RUN - no documents will be deleted ***\n');

  for (const col of toDelete) {
    try {
      const count = await countDocuments(col);
      console.log(`Collection ${col} has ${count} documents`);
      if (count > 0) {
        await deleteCollection(col);
      }
    } catch (e) {
      console.error('Error processing collection', col, e.message);
    }
  }

  console.log('\nCleanup finished.');
  process.exit(0);
})();
