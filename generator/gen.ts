// Simple script to generate high-quality synthetic data

// 100 emails, 100 notes, and 100 events

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
    console.log("\n📧 Generating threads...");
    for (let i = 0; i < 1; i++) {
      await generateThreads();
    }

    console.log("\n📝 Generating notes...");
    for (let i = 0; i < 1; i++) {
      await generateNotes();
    }

    console.log("\n📅 Generating events...");
    for (let i = 0; i < 1; i++) {
      await generateEvents();
    }

    console.log("\n👥 Generating entities...");
    for (let i = 0; i < 1; i++) {
      await generateEntities();
    }

    console.log("\n🏢 Generating organizations...");
    for (let i = 0; i < 1; i++) {
      await generateOrgs();
    }

    console.log("\n✅ Data generation complete!");
  } catch (error) {
    console.error("❌ Error during data generation:", error);
    process.exit(1);
  }
}

// Run the generator
main();
