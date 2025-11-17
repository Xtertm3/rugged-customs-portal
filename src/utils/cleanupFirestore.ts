import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc,
  writeBatch 
} from 'firebase/firestore';

const COLLECTIONS_TO_DELETE = [
  'sites',
  'paymentRequests',
  'inventory',
  'materialUsageLogs',
  'transporters',
  'jobCards'
];

export async function cleanupFirestore(onProgress?: (message: string) => void) {
  const db = getFirestore();
  let totalDeleted = 0;

  for (const collectionName of COLLECTIONS_TO_DELETE) {
    try {
      onProgress?.(`Processing collection: ${collectionName}...`);
      
      const snapshot = await getDocs(collection(db, collectionName));
      onProgress?.(`Found ${snapshot.size} documents in ${collectionName}`);
      
      if (snapshot.empty) {
        continue;
      }

      // Delete in batches of 500
      const batchSize = 500;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const document of snapshot.docs) {
        batch.delete(doc(db, collectionName, document.id));
        batchCount++;
        totalDeleted++;

        if (batchCount >= batchSize) {
          await batch.commit();
          onProgress?.(`Deleted ${batchCount} documents from ${collectionName}`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
        onProgress?.(`Deleted ${batchCount} documents from ${collectionName}`);
      }

      onProgress?.(`✓ Completed ${collectionName}`);
    } catch (error) {
      onProgress?.(`✗ Error in ${collectionName}: ${error}`);
      console.error(`Error deleting ${collectionName}:`, error);
    }
  }

  onProgress?.(`\n🎉 Cleanup complete! Total documents deleted: ${totalDeleted}`);
  return totalDeleted;
}
