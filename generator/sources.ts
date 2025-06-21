// Simple script to generate high-quality synthetic data

import {
  generateThreads,
  generateNotes,
  generateEvents,
  generateEntities,
  generateOrgs,
} from "./lib";

async function main() {
  console.log("🚀 Starting data generation...");

  // Each generation call will create about 5 objects
  try {
    console.log("\n🚀 Starting parallel data generation...");

    const NUM = 5;

    await Promise.all([
      (async () => {
        console.log("\n📧 Generating threads...");
        for (let i = 0; i < NUM; i++) {
          await generateThreads();
        }
      })(),

      (async () => {
        console.log("\n📝 Generating notes...");
        for (let i = 0; i < NUM; i++) {
          await generateNotes();
        }
      })(),

      (async () => {
        console.log("\n📅 Generating events...");
        for (let i = 0; i < NUM; i++) {
          await generateEvents();
        }
      })(),

      (async () => {
        console.log("\n👥 Generating entities...");
        for (let i = 0; i < NUM; i++) {
          await generateEntities();
        }
      })(),

      (async () => {
        console.log("\n🏢 Generating organizations...");
        for (let i = 0; i < NUM; i++) {
          await generateOrgs();
        }
      })(),
    ]);

    console.log("\n✅ Data generation complete!");
  } catch (error) {
    console.error("❌ Error during data generation:", error);
    process.exit(1);
  }
}

// Run the generator
main();
