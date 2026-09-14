// src/types/crm.types.ts

export type ContactTag = "hot" | "warm" | "cold";
export type ContactSource =
  | "demo_request"
  | "referral"
  | "cold_outreach"
  | "website"
  | "event"
  | "partner"
  | "other";

export type DealStage =
  | "lead_in"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType =
  | "call"
  | "email"
  | "follow_up"
  | "meeting"
  | "note"
  | "stage_change"
  | "task_created";

export type Currency = "BDT" | "SAR" | "USD" | "AED" | "INR" | "EUR" | "GBP";

export interface UserLite {
  _id: string;
  fullName: string;
  email: string;
}

export interface ScoreBreakdownItem {
  reason: string;
  points: number;
}

export interface Contact {
  _id: string;
  name: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappOptIn?: boolean;
  owner: UserLite | string;
  tag: ContactTag;
  source: ContactSource;
  companySize?: number;
  leadId?: string | { _id: string; stage: DealStage; value: number; currency: Currency } | null;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  _id: string;
  contactId: Contact | string;
  companyName: string;
  dealName?: string;
  stage: DealStage;
  value: number;
  currency: Currency;
  probability: number;
  expectedCloseDate?: string;
  closedAt?: string | null;
  owner: UserLite | string;
  score?: number;
  scoreBreakdown?: ScoreBreakdownItem[];
  engagement?: {
    emailsOpened: number;
    emailsSent: number;
    callsMade: number;
    meetingsHeld: number;
    lastEngagementAt?: string | null;
  };
  lastActivityAt?: string | null;
  stageHistory?: {
    from?: DealStage | null;
    to: DealStage;
    at: string;
    by: string;
    note?: string;
  }[];
  projectId?: { _id: string; name: string; code?: string; status?: string } | string | null;
  clientId?: { _id: string; name: string; sector?: string; stage?: string } | string | null;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealActivity {
  _id: string;
  leadId: string | { _id: string; companyName: string; dealName?: string; stage: DealStage };
  type: ActivityType;
  summary: string;
  details?: string;
  duration?: number;
  scheduledFor?: string | null;
  metadata?: {
    fromStage?: DealStage;
    toStage?: DealStage;
    taskId?: string;
    projectId?: string;
  };
  createdBy: UserLite | string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientVisit {
  _id: string;
  at: string;
  by: UserLite | string;
  purpose?: string;
  notes?: string;
  location?: string;
}

export interface Client {
  _id: string;
  name: string;
  sector?: string;
  location?: string;
  city?: string;
  country?: string;
  stage: "hot" | "warm" | "won" | "cold";
  assignedRep?: UserLite | string;
  lastVisitAt?: string | null;
  visitsPerMonth?: number;
  visitLog?: ClientVisit[];
  nextAction?: { label?: string; dueAt?: string | null; isOverdue?: boolean };
  projectIds?: string[];
  contactIds?: (Contact | string)[];
  notes?: string;
  openRfqCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rfq {
  _id: string;
  clientId: string | { _id: string; name: string };
  title: string;
  reference?: string;
  value?: number;
  currency: Currency;
  status: "open" | "submitted" | "closed" | "cancelled";
  submittedAt?: string | null;
  closedAt?: string | null;
  dueAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealStageConfig {
  stageKey: DealStage;
  label: string;
  defaultProbability: number;
  order: number;
  isTerminal: boolean;
  color: string;
}

export interface ForecastRow {
  month: string; // "2025-01"
  weighted: number;
  raw: number;
  count: number;
}

export interface LeaderboardRow {
  userId: string;
  fullName: string;
  email: string;
  wonRevenue: number;
  wonCount: number;
  activities: number;
}

export interface PipelineGroup {
  stage: DealStage;
  label: string;
  order: number;
  defaultProbability: number;
  color: string;
  count: number;
  weighted: number;
  raw: number;
  leads: Lead[];
}

export interface PipelineSummary {
  grouped: PipelineGroup[];
  totals: { weighted: number; raw: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
}