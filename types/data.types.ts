export interface RawEntity {
  id: string;
  name: string;
  last_updated?: string;
  last_communication?: string;
  created_at?: string;
  importing?: boolean;
  photo?: string;
  emails?: string[];
  is_me?: boolean;
  location?: string;
  state?: string;
  country_code?: string;
  phone_number?: string;
  research?: string;
  summary?: string;
  long_summary?: string;
  linked_in?: string | null;
  linked_in_maybes?: string;
  linked_in_followers?: number;
  org_id: string;
}

export interface RawThread {
  id: string;
  thread_id: string;
  content: any;
  summary: any;
  attachments: string[];
  subject: string;
  org_id: string;
  user_id: string;
  type: string;
  date: string;
  organization: any;
}

export interface RawNote {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  content: string;
  timestamp: string;
  summary?: string;
  type: string;
  organization: any;
}

export interface RawEvent {
  id: string;
  eid: string;
  user_id: string;
  org_id: string;
  title: string;
  duration: number;
  start_time: string;
  end_time: string;
  is_owner: boolean;
  recording_mode: string;
  connectedEntityIds: string[];
  link?: string;
  content?: string;
  type: string;
  summary?: string;
  organization: any;
}

export interface RawOrg {
  id: string;
  name: string;
  photo?: string;
  description?: string;
  websites?: string[];
  industry?: string;
  location?: string;
  type: string;
  created_at?: number;
  org_id: string;
}

export interface ResponseData {
  data: string[];
}

export interface FineTomeTrainingData {
  conversations: Array<{
    from: "human" | "gpt";
    value: string;
  }>;
  source: string;
  score: number;
}
