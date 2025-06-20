export enum ParentType {
  ORG = "ORG",
  ENTITY = "ENTITY",
  EVENT = "EVENT",
  THREAD = "THREAD",
  NOTE = "NOTE",
}

export enum OrgType {
  SELF = "SELF",
  COMPANY = "COMPANY",
  INSTITUTION = "INSTITUTION",
  TEAM = "TEAM",
  CONFERENCE = "CONFERENCE",
  GROUP = "GROUP",
  OTHER = "OTHER",
}

export type Entity = {
  id: string;
  name: string; // IMPORTANT
  last_updated?: string; // unix timestamp
  last_communication?: string; // unix timestamp
  created_at?: string; // unix timestamp
  importing?: boolean;
  photo?: string;
  emails?: string[];
  is_me?: boolean;
  location?: string; // IMPORTANT, optional
  state?: string; // IMPORTANT, optional
  country_code?: string; // IMPORTANT, optional
  phone_number?: string;
  research?: string;
  summary?: string; // IMPORTANT eg. Early Stage Investor
  long_summary?: string; // IMPORTANT, optional
  linked_in?: string | null;
  linked_in_maybes?: string;
  linked_in_followers?: number;
  org_id: string;
};

export type Organization = {
  id: string;
  name: string; // IMPORTANT
  photo?: string;
  description?: string; // IMPORTANT, optional
  websites?: string[]; // IMPORTANT, optional
  industry?: string; // IMPORTANT, optional
  location?: string; // IMPORTANT, optional
  type: OrgType; // IMPORTANT
  created_at?: number;
  org_id: string;
};

export type Event = {
  id: string;
  eid: string;
  user_id: string;
  org_id: string;
  title: string; // IMPORTANT
  duration: number;
  start_time: string;
  end_time: string;
  is_owner: boolean;
  recording_mode: string;
  connectedEntityIds: string[];
  link?: string;
  content?: string; // IMPORTANT, optional (transcript in unknown format)
  type: ParentType;
  summary?: string; // IMPORTANT, optional (summary of the event)
  organization: Organization;
};

export type Note = {
  id: string;
  org_id: string;
  user_id: string;
  title: string; // IMPORTANT
  content: string; // IMPORTANT, optional (not too long)
  timestamp: string;
  summary?: string; // IMPORTANT, optional (summary of the note)
  type: ParentType;
  organization: Organization;
};

export type Thread = {
  id: string;
  thread_id: string;
  content: object; // IMPORTANT, thread content in unknown format
  summary: object; // always empty
  attachments: string[];
  subject: string; // IMPORTANT
  org_id: string;
  user_id: string;
  type: ParentType;
  date: string;
  organization: Organization;
};
