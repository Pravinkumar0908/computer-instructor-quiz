/**
 * One-time seed script to migrate existing JSON data to Firebase Firestore
 * 
 * Usage:
 *   npx tsx src/scripts/seed-firebase.ts
 * 
 * Prerequisites:
 *   1. Fill in your Firebase config in .env.local
 *   2. Make sure Firestore is enabled in Firebase Console
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, writeBatch, doc, getDocs } from "firebase/firestore";
import { readFileSync } from "fs";
import { join } from "path";

// Load env vars manually since this runs outside Next.js (no dotenv dependency needed)
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.error("Could not read .env.local file");
  }
}
loadEnvFile(join(process.cwd(), ".env.local"));

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔥 Initializing Firebase...");
console.log(`   Project: ${firebaseConfig.projectId}`);

if (!firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID_HERE") {
  console.error("❌ ERROR: Please fill in your Firebase config in .env.local first!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedQuestions() {
  const filePath = join(process.cwd(), "src/data/db_questions.json");
  console.log("\n📚 Reading questions from:", filePath);

  try {
    const raw = readFileSync(filePath, "utf-8");
    const questions = JSON.parse(raw);
    console.log(`   Found ${questions.length} questions`);

    // Check if questions already exist in Firestore
    const existingDocs = await getDocs(collection(db, "questions"));
    if (existingDocs.size > 0) {
      console.log(`   ⚠️  Firestore already has ${existingDocs.size} questions. Skipping to avoid duplicates.`);
      return;
    }

    // Batch write (max 500 per batch)
    let batchCount = 0;
    let totalWritten = 0;

    for (let i = 0; i < questions.length; i += 450) {
      const chunk = questions.slice(i, i + 450);
      const batch = writeBatch(db);

      for (const q of chunk) {
        const docRef = doc(collection(db, "questions"));
        // Remove old id field, Firestore will generate its own
        const { id, ...questionData } = q;
        batch.set(docRef, {
          ...questionData,
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      batchCount++;
      totalWritten += chunk.length;
      console.log(`   ✅ Batch ${batchCount}: wrote ${chunk.length} questions (total: ${totalWritten})`);
    }

    console.log(`   🎉 Successfully seeded ${totalWritten} questions to Firestore!`);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.log("   ⚠️  No db_questions.json found, skipping questions seed.");
    } else {
      console.error("   ❌ Error seeding questions:", err.message);
    }
  }
}

async function seedAttempts() {
  const filePath = join(process.cwd(), "src/data/db_attempts.json");
  console.log("\n📊 Reading attempts from:", filePath);

  try {
    const raw = readFileSync(filePath, "utf-8");
    const attempts = JSON.parse(raw);
    console.log(`   Found ${attempts.length} attempts`);

    // Check if attempts already exist in Firestore
    const existingDocs = await getDocs(collection(db, "attempts"));
    if (existingDocs.size > 0) {
      console.log(`   ⚠️  Firestore already has ${existingDocs.size} attempts. Skipping to avoid duplicates.`);
      return;
    }

    for (const attempt of attempts) {
      const { id, ...attemptData } = attempt;
      await addDoc(collection(db, "attempts"), {
        ...attemptData,
        userId: "", // Legacy attempts have no user association
      });
    }

    console.log(`   🎉 Successfully seeded ${attempts.length} attempts to Firestore!`);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.log("   ⚠️  No db_attempts.json found, skipping attempts seed.");
    } else {
      console.error("   ❌ Error seeding attempts:", err.message);
    }
  }
}

async function main() {
  console.log("=" .repeat(50));
  console.log("🌱 Firebase Firestore Data Seeder");
  console.log("=".repeat(50));

  await seedQuestions();
  await seedAttempts();

  console.log("\n" + "=".repeat(50));
  console.log("✅ Seed complete! Check your Firebase Console:");
  console.log("   https://console.firebase.google.com");
  console.log("=".repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
