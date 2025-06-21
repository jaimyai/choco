// Script to clean and process raw data for Unsloth training

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "fs";
import { join } from "path";
import type {
  RawEntity,
  RawThread,
  RawNote,
  RawEvent,
  RawOrg,
  ResponseData,
  UnslothTrainingData,
} from "../types/data.types";

// Function to read JSON file
const readJsonFile = (filePath: string): any => {
  try {
    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

// Function to get all files in a folder
const getFilesInFolder = (folder: string, prefix: string): number[] => {
  try {
    return readdirSync(folder)
      .filter((file) => file.startsWith(prefix) && file.endsWith(".json"))
      .map((file) => {
        const match = file.match(new RegExp(`${prefix}_(\\d+)\\.json`));
        return match ? match[1] : null;
      })
      .filter((num) => num !== null)
      .map((num) => parseInt(num!))
      .sort((a, b) => a - b);
  } catch (error) {
    return [];
  }
};

// Function to check if response file exists
const responseFileExists = (
  folder: string,
  prefix: string,
  number: number
): boolean => {
  const responsePath = join(folder, `${prefix}_${number}_response.json`);
  return existsSync(responsePath);
};

// Function to clean entity data
const cleanEntityData = (
  entity: RawEntity,
  response: ResponseData
): UnslothTrainingData => {
  const input = `Entity Information:
Name: ${entity.name}
${entity.summary ? `Summary: ${entity.summary}` : ""}
${entity.long_summary ? `Long Summary: ${entity.long_summary}` : ""}
${entity.research ? `Research: ${entity.research}` : ""}
${entity.location ? `Location: ${entity.location}` : ""}
${entity.state ? `State: ${entity.state}` : ""}
${entity.country_code ? `Country: ${entity.country_code}` : ""}`;

  const output = response.data.join("\n");

  return {
    instruction:
      "Extract meaningful, de-contextualized propositions from this entity data. Focus only on the semantic meaning and business context. Use full nouns, never pronouns. Every proposition must include the person's name.",
    input: input.trim(),
    output: output,
  };
};

// Function to clean thread data
const cleanThreadData = (
  thread: RawThread,
  response: ResponseData
): UnslothTrainingData => {
  const emailContent = thread.content?.emails
    ? Array.isArray(thread.content.emails)
      ? thread.content.emails.map((email: any) => email.body || "").join("\n")
      : thread.content.emails.body || ""
    : "";

  const input = `Email Thread Information:
Subject: ${thread.subject}
${emailContent ? `Content: ${emailContent}` : ""}
${thread.summary && Object.keys(thread.summary).length > 0 ? `Summary: ${JSON.stringify(thread.summary)}` : ""}`;

  const output = response.data.join("\n");

  return {
    instruction:
      "Extract meaningful, de-contextualized propositions from this email thread data. Focus only on the semantic meaning and business context. Use full nouns, never pronouns. Every proposition must include the thread subject.",
    input: input.trim(),
    output: output,
  };
};

// Function to clean note data
const cleanNoteData = (
  note: RawNote,
  response: ResponseData
): UnslothTrainingData => {
  const input = `Note Information:
Title: ${note.title}
${note.content ? `Content: ${note.content}` : ""}
${note.summary ? `Summary: ${note.summary}` : ""}`;

  const output = response.data.join("\n");

  return {
    instruction:
      "Extract meaningful, de-contextualized propositions from this note data. Focus only on the semantic meaning and business context. Use full nouns, never pronouns. Every proposition must include the note title.",
    input: input.trim(),
    output: output,
  };
};

// Function to clean event data
const cleanEventData = (
  event: RawEvent,
  response: ResponseData
): UnslothTrainingData => {
  const input = `Event Information:
Title: ${event.title}
${event.content ? `Content: ${event.content}` : ""}
${event.summary ? `Summary: ${event.summary}` : ""}`;

  const output = response.data.join("\n");

  return {
    instruction:
      "Extract meaningful, de-contextualized propositions from this event data. Focus only on the semantic meaning and business context. Use full nouns, never pronouns. Every proposition must include the event title.",
    input: input.trim(),
    output: output,
  };
};

// Function to clean organization data
const cleanOrgData = (
  org: RawOrg,
  response: ResponseData
): UnslothTrainingData => {
  const input = `Organization Information:
Name: ${org.name}
${org.description ? `Description: ${org.description}` : ""}
${org.industry ? `Industry: ${org.industry}` : ""}
${org.location ? `Location: ${org.location}` : ""}
${org.type ? `Type: ${org.type}` : ""}`;

  const output = response.data.join("\n");

  return {
    instruction:
      "Extract meaningful, de-contextualized propositions from this organization data. Focus only on the semantic meaning and business context. Use full nouns, never pronouns. Every proposition must include the organization name.",
    input: input.trim(),
    output: output,
  };
};

// Main processing function
const processData = async () => {
  console.log("🧹 Starting data cleaning and processing...");

  // Create processed directory
  const processedDir = "processed";
  mkdirSync(processedDir, { recursive: true });

  const allTrainingData: UnslothTrainingData[] = [];

  // Process entities
  console.log("\n👥 Processing entities...");
  const entityNumbers = getFilesInFolder("raw/entities", "entity");
  for (const number of entityNumbers) {
    if (responseFileExists("raw/entities", "entity", number)) {
      const entity = readJsonFile(
        join("raw/entities", `entity_${number}.json`)
      ) as RawEntity;
      const response = readJsonFile(
        join("raw/entities", `entity_${number}_response.json`)
      ) as ResponseData;

      if (entity && response) {
        const cleaned = cleanEntityData(entity, response);
        allTrainingData.push(cleaned);
      }
    }
  }

  // Process threads
  console.log("\n📧 Processing threads...");
  const threadNumbers = getFilesInFolder("raw/threads", "thread");
  for (const number of threadNumbers) {
    if (responseFileExists("raw/threads", "thread", number)) {
      const thread = readJsonFile(
        join("raw/threads", `thread_${number}.json`)
      ) as RawThread;
      const response = readJsonFile(
        join("raw/threads", `thread_${number}_response.json`)
      ) as ResponseData;

      if (thread && response) {
        const cleaned = cleanThreadData(thread, response);
        allTrainingData.push(cleaned);
      }
    }
  }

  // Process notes
  console.log("\n📝 Processing notes...");
  const noteNumbers = getFilesInFolder("raw/notes", "note");
  for (const number of noteNumbers) {
    if (responseFileExists("raw/notes", "note", number)) {
      const note = readJsonFile(
        join("raw/notes", `note_${number}.json`)
      ) as RawNote;
      const response = readJsonFile(
        join("raw/notes", `note_${number}_response.json`)
      ) as ResponseData;

      if (note && response) {
        const cleaned = cleanNoteData(note, response);
        allTrainingData.push(cleaned);
      }
    }
  }

  // Process events
  console.log("\n📅 Processing events...");
  const eventNumbers = getFilesInFolder("raw/events", "event");
  for (const number of eventNumbers) {
    if (responseFileExists("raw/events", "event", number)) {
      const event = readJsonFile(
        join("raw/events", `event_${number}.json`)
      ) as RawEvent;
      const response = readJsonFile(
        join("raw/events", `event_${number}_response.json`)
      ) as ResponseData;

      if (event && response) {
        const cleaned = cleanEventData(event, response);
        allTrainingData.push(cleaned);
      }
    }
  }

  // Process organizations
  console.log("\n🏢 Processing organizations...");
  const orgNumbers = getFilesInFolder("raw/orgs", "org");
  for (const number of orgNumbers) {
    if (responseFileExists("raw/orgs", "org", number)) {
      const org = readJsonFile(
        join("raw/orgs", `org_${number}.json`)
      ) as RawOrg;
      const response = readJsonFile(
        join("raw/orgs", `org_${number}_response.json`)
      ) as ResponseData;

      if (org && response) {
        const cleaned = cleanOrgData(org, response);
        allTrainingData.push(cleaned);
      }
    }
  }

  // Save the processed data
  const outputPath = join(processedDir, "unsloth_training_data.json");
  writeFileSync(outputPath, JSON.stringify(allTrainingData, null, 2));

  console.log(`\n✅ Processing complete!`);
  console.log(`📊 Total training examples: ${allTrainingData.length}`);
  console.log(`💾 Saved to: ${outputPath}`);

  // Show breakdown
  const entityCount = entityNumbers.filter((n) =>
    responseFileExists("raw/entities", "entity", n)
  ).length;
  const threadCount = threadNumbers.filter((n) =>
    responseFileExists("raw/threads", "thread", n)
  ).length;
  const noteCount = noteNumbers.filter((n) =>
    responseFileExists("raw/notes", "note", n)
  ).length;
  const eventCount = eventNumbers.filter((n) =>
    responseFileExists("raw/events", "event", n)
  ).length;
  const orgCount = orgNumbers.filter((n) =>
    responseFileExists("raw/orgs", "org", n)
  ).length;

  console.log(`\n📈 Breakdown:`);
  console.log(`  Entities: ${entityCount}`);
  console.log(`  Threads: ${threadCount}`);
  console.log(`  Notes: ${noteCount}`);
  console.log(`  Events: ${eventCount}`);
  console.log(`  Organizations: ${orgCount}`);
};

// Run the processor
processData().catch(console.error);
