export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  score: number;
  lastEnrichedAt?: Date;
  [key: string]: any;
}

export interface Deal {
  id: string;
  contactId: string;
  stage: string;
  value: number;
  probability: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  deals: Deal[];
}
