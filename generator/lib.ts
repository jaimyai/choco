import OpenAI from "openai";
import { writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import type {
  Thread,
  Note,
  Event,
  Entity,
  Organization,
} from "../prisma.types";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// Generic function to generate data
const generateData = async <T>(
  prompt: string,
  count: number = 5
): Promise<T[]> => {
  const response = await client.chat.completions.create({
    model: "o4-mini-2025-04-16",
    // model: "gpt-4o-mini-2024-07-18",
    // temperature: 0.8,
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated");
  }

  // Parse the JSON response
  try {
    const results = extractJsonObjects<T>(content);
    return results.slice(0, count);
  } catch (error) {
    console.error("Failed to parse generated content:", error);
    console.error("Content was:", content);
    throw error;
  }
};

const extractJsonObjects = <T = unknown>(
  raw: string,
  limit = Number.POSITIVE_INFINITY
): T[] => {
  // 1. Remove code-fence wrappers
  let text = raw
    .replace(/```(?:json)?/gi, "") // any ``` or ```json
    .trim();

  const out: T[] = [];
  let start = -1; // index where current object starts
  let depth = 0; // brace balance
  let inString = false; // inside double-quoted string?
  let escaped = false; // previous char was backslash?

  // 2. Single pass scan
  for (let i = 0; i < text.length && out.length < limit; i++) {
    const ch = text[i];

    // track escapes inside strings
    if (inString) {
      escaped = ch === "\\" && !escaped;
      if (ch === '"' && !escaped) inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i; // mark new object
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const slice = text.slice(start, i + 1);
        try {
          out.push(JSON.parse(slice));
        } catch {
          /* ignore malformed fragment */
        }
        start = -1;
      }
    }
  }

  // 3. Fallback: maybe the whole thing is a single array
  if (out.length === 0) {
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) return parsed.slice(0, limit);
      if (parsed && typeof parsed === "object") return [parsed as T];
    } catch {
      /* ignore */
    }
    throw new Error("No valid JSON objects found");
  }

  return out;
};

// Save data to files
const saveData = <T>(data: T[], folder: string, prefix: string) => {
  // Create folder if it doesn't exist
  mkdirSync(folder, { recursive: true });

  // Check for existing files to determine starting number
  let startNumber = 1;
  try {
    const existingFiles = readdirSync(folder)
      .filter((file) => file.startsWith(prefix) && file.endsWith(".json"))
      .map((file) => {
        const match = file.match(new RegExp(`${prefix}_(\\d+)\\.json`));
        return match && match[1] ? parseInt(match[1]) : 0;
      })
      .filter((num) => num > 0);

    if (existingFiles.length > 0) {
      startNumber = Math.max(...existingFiles) + 1;
    }
  } catch (error) {
    // Folder might not exist yet, start from 1
    startNumber = 1;
  }

  data.forEach((item, index) => {
    const filename = `${prefix}_${startNumber + index}.json`;
    const filepath = join(folder, filename);
    writeFileSync(filepath, JSON.stringify(item, null, 2));
    console.log(`Created ${filepath}`);
  });
};

export const generateThreads = async () => {
  const prompt = `Generate exactly 5 JSON objects, each on a separate line. Do NOT wrap in markdown code blocks or backticks. Output raw JSON only.

Each object should be a valid email thread with this structure:
{
  "id": "unique-uuid",
  "thread_id": "unique-thread-id", 
  "content": {"emails": [{"from": "email@example.com", "to": ["recipient@example.com"], "subject": "Subject", "body": "Email body", "date": "2024-01-01T10:00:00Z"}]},
  "summary": {},
  "attachments": ["file1.pdf", "file2.docx"],
  "subject": "Email subject line",
  "org_id": "org-uuid",
  "user_id": "user-uuid",
  "type": "THREAD",
  "date": "2024-01-01T10:00:00Z",
  "organization": {"id": "org-uuid", "name": "Company Name", "type": "COMPANY", "org_id": "org-uuid"}
}

IMPORTANT: Always include subject, content, and organization.name fields with realistic data.
Sometimes include organization.description, organization.industry, organization.location.
Always include random data for other fields like attachments, summary, etc.

SCHEMA VARIETY: Vary the structure of content and other fields:
- content.emails: Sometimes use array of objects, sometimes single object, sometimes nested structure
- content: Sometimes include additional fields like "thread_id", "participants", "cc", "bcc"
- summary: Sometimes empty object {}, sometimes with fields like "key_points", "action_items", "sentiment"
- attachments: Sometimes array of strings, sometimes array of objects with metadata
- organization: Sometimes include all fields, sometimes minimal fields, sometimes extra fields like "website", "employees"

CONTENT VARIETY: Vary email content significantly:
- Short emails: 1-3 sentences (quick updates, confirmations)
- Medium emails: 4-8 sentences (detailed explanations, project updates)
- Long emails: 9-15 sentences (comprehensive reports, detailed proposals)
- Include different formats: formal business, casual team, client communications
- Vary email threads: single emails, short conversations (2-3 emails), longer threads (4-6 emails)
- Include different email types: meeting requests, project updates, feedback, announcements, follow-ups

Make the email threads diverse - business meetings, project updates, client communications, etc.

Format: Output 5 raw JSON objects, each on its own line, no markdown formatting.`;

  const threads = await generateData<Thread>(prompt);
  saveData(threads, "threads", "thread");
  return threads;
};

export const generateNotes = async () => {
  const prompt = `Generate exactly 5 JSON objects, each on a separate line. Do NOT wrap in markdown code blocks or backticks. Output raw JSON only.

Each object should be a valid note with this structure:
{
  "id": "unique-uuid",
  "org_id": "org-uuid",
  "user_id": "user-uuid",
  "title": "Note title",
  "content": "Note content (not too long)",
  "timestamp": "2024-01-01T10:00:00Z",
  "summary": "Summary of the note",
  "type": "NOTE",
  "organization": {"id": "org-uuid", "name": "Company Name", "type": "COMPANY", "org_id": "org-uuid"}
}

IMPORTANT: Always include title, content, and summary fields with realistic data.
Sometimes include organization.description, organization.industry.
Always include random data for other fields.

SCHEMA VARIETY: Vary the structure of content and other fields:
- content: Sometimes plain string, sometimes object with "text", "format", "tags", sometimes array of sections
- summary: Sometimes string, sometimes object with "key_points", "action_items", "follow_up"
- organization: Sometimes include all fields, sometimes minimal fields, sometimes extra fields
- Sometimes include additional fields like "tags", "priority", "category", "related_entities"

CONTENT VARIETY: Vary note content significantly:
- Short notes: 1-2 sentences (quick reminders, action items)
- Medium notes: 3-6 sentences (meeting notes, project updates)
- Include different formats: bullet points, numbered lists, paragraphs, mixed formats
- Vary note types: notes about people, meetings, events, organizations, etc. meeting notes, project ideas, reminders, etc.
- Include different styles: formal documentation, casual notes, technical specifications

Make the notes diverse - notes about people, meetings, events, organizations, etc. meeting notes, project ideas, reminders, etc.

Format: Output 5 raw JSON objects, each on its own line, no markdown formatting.`;

  const notes = await generateData<Note>(prompt);
  saveData(notes, "notes", "note");
  return notes;
};

export const generateEvents = async () => {
  const prompt = `Generate exactly 5 JSON objects, each on a separate line. Do NOT wrap in markdown code blocks or backticks. Output raw JSON only.

Each object should be a valid event with this structure:
{
  "id": "unique-uuid",
  "eid": "event-id",
  "user_id": "user-uuid",
  "org_id": "org-uuid",
  "title": "Event title",
  "duration": 3600,
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T11:00:00Z",
  "is_owner": true,
  "recording_mode": "auto",
  "connectedEntityIds": ["entity1", "entity2"],
  "link": "https://meet.google.com/abc-defg-hij",
  "content": "Event transcript or notes",
  "type": "EVENT",
  "summary": "Event summary",
  "organization": {"id": "org-uuid", "name": "Company Name", "type": "COMPANY", "org_id": "org-uuid"}
}

IMPORTANT: Always include title, content, and summary fields with realistic data.
Sometimes include organization.description, organization.industry, organization.location.
Always include random data for other fields like recording_mode, connectedEntityIds, etc.

SCHEMA VARIETY: Vary the structure of content and other fields:
- content: Sometimes plain string transcript, sometimes object with "transcript", "notes", "participants", sometimes array of segments
- summary: Sometimes string, sometimes object with "key_points", "decisions", "action_items", "attendees"
- connectedEntityIds: Sometimes array of strings, sometimes array of objects with "id", "name", "role"
- organization: Sometimes include all fields, sometimes minimal fields, sometimes extra fields
- Sometimes include additional fields like "agenda", "participants", "recording_url", "transcript_format"

CONTENT VARIETY: Vary event content significantly:
- Short transcripts: 2-4 sentences (quick check-ins, brief updates)
- Medium transcripts: 5-10 sentences (regular meetings, project reviews)
- Long transcripts: 11-25 sentences (detailed discussions, presentations, interviews)
- Include different formats: conversation transcripts, meeting notes, presentation summaries
- Vary event types: team meetings, client calls, interviews, presentations, workshops, brainstorming sessions
- Include different styles: formal business meetings, casual team discussions, technical presentations, sales calls
- Vary duration: 15 minutes to 2 hours (adjust content length accordingly)

Make the events diverse - team meetings, client calls, interviews, presentations, etc.

Format: Output 5 raw JSON objects, each on its own line, no markdown formatting.`;

  const events = await generateData<Event>(prompt);
  saveData(events, "events", "event");
  return events;
};

export const generateEntities = async () => {
  const prompt = `Generate exactly 5 JSON objects, each on a separate line. Do NOT wrap in markdown code blocks or backticks. Output raw JSON only.

Each object should be a valid entity (person) with this structure:
{
  "id": "unique-uuid",
  "name": "Person's full name",
  "last_updated": "1704067200",
  "last_communication": "1704067200",
  "created_at": "1704067200",
  "importing": false,
  "photo": "https://example.com/photo.jpg",
  "emails": ["person@example.com"],
  "is_me": false,
  "location": "City, State",
  "state": "State",
  "country_code": "US",
  "phone_number": "+1-555-0123",
  "research": "Some research notes",
  "summary": "Professional summary (e.g., 'Early Stage Investor')",
  "long_summary": "Detailed professional description",
  "linked_in": "https://linkedin.com/in/person",
  "linked_in_maybes": "maybe@example.com",
  "linked_in_followers": 1500,
  "org_id": "org-uuid"
}

IMPORTANT: Always include name, summary, and location fields with realistic data.
Sometimes include long_summary, state, country_code, linked_in.
Always include random data for other fields like photo, research, linked_in_followers, etc.

SCHEMA VARIETY: Vary the structure of fields:
- emails: Sometimes array of strings, sometimes array of objects with "email", "type", "verified"
- research: Sometimes plain string, sometimes object with "notes", "sources", "last_researched", sometimes array of research items
- summary: Sometimes string, sometimes object with "title", "company", "industry", "experience"
- long_summary: Sometimes string, sometimes object with "background", "expertise", "achievements"
- Sometimes include additional fields like "social_media", "interests", "skills", "education"

CONTENT VARIETY: Vary entity content significantly:
- Short summaries: 1-2 sentences (basic professional title)
- Medium summaries: 3-6 sentences (detailed role description)
- Long summaries: 7-15 sentences (comprehensive professional background)
- Include different formats: formal titles, descriptive paragraphs, bullet points
- Vary research notes: brief mentions, detailed research findings, contact history
- Include different professional levels: entry-level, mid-career, senior executives, founders, investors

Make the entities diverse - investors, founders, employees, consultants, etc.

Format: Output 5 raw JSON objects, each on its own line, no markdown formatting.`;

  const entities = await generateData<Entity>(prompt);
  saveData(entities, "entities", "entity");
  return entities;
};

export const generateOrgs = async () => {
  const prompt = `Generate exactly 5 JSON objects, each on a separate line. Do NOT wrap in markdown code blocks or backticks. Output raw JSON only.

Each object should be a valid organization with this structure:
{
  "id": "unique-uuid",
  "name": "Organization name",
  "photo": "https://example.com/logo.png",
  "description": "Organization description",
  "websites": ["https://example.com"],
  "industry": "Industry (e.g., 'Technology', 'Healthcare')",
  "location": "City, State",
  "type": "COMPANY",
  "created_at": 1704067200,
  "org_id": "org-uuid"
}

IMPORTANT: Always include name field with realistic data.
Sometimes include description, industry, location, websites.
Always include random data for other fields like photo, created_at, etc.

SCHEMA VARIETY: Vary the structure of fields:
- websites: Sometimes array of strings, sometimes array of objects with "url", "type", "primary"
- description: Sometimes plain string, sometimes object with "overview", "mission", "values", "history"
- industry: Sometimes string, sometimes array of industries, sometimes object with "primary", "secondary"
- location: Sometimes string, sometimes object with "city", "state", "country", "address"
- Sometimes include additional fields like "size", "founded", "funding", "social_media", "contact_info"

CONTENT VARIETY: Vary organization content significantly:
- Short descriptions: 1-2 sentences (basic company overview)
- Medium descriptions: 3-6 sentences (detailed company profile)
- Long descriptions: 7-12 sentences (comprehensive company background)
- Include different formats: formal company descriptions, mission statements, value propositions
- Vary organization types: startups, corporations, nonprofits, agencies, educational institutions
- Include different industries: technology, healthcare, finance, education, manufacturing, retail, etc.
- Vary company sizes: small startups, mid-size companies, large corporations

Make the organizations diverse - startups, corporations, nonprofits, agencies, etc.
Use different types: COMPANY, INSTITUTION, TEAM, CONFERENCE, GROUP, OTHER.

Format: Output 5 raw JSON objects, each on its own line, no markdown formatting.`;

  const orgs = await generateData<Organization>(prompt);
  saveData(orgs, "orgs", "org");
  return orgs;
};
