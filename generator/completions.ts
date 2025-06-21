// Script to generate chat responses for all raw data files

import {
  generateAllEntityResponses,
  generateAllThreadResponses,
  generateAllNoteResponses,
  generateAllEventResponses,
  generateAllOrgResponses,
} from "./lib";

async function main() {
  console.log("🚀 Starting response generation...");

  try {
    console.log("\n🚀 Starting parallel response generation...");

    const NUM = 20;

    await Promise.all([
      generateAllEntityResponses(NUM),
      generateAllThreadResponses(NUM),
      generateAllNoteResponses(NUM),
      generateAllEventResponses(NUM),
      generateAllOrgResponses(NUM),
    ]);

    console.log("\n✅ Response generation complete!");
  } catch (error) {
    console.error("❌ Error during response generation:", error);
    process.exit(1);
  }
}

// Run the generator
main();
