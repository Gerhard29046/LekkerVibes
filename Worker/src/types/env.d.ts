export type Role = 'member' | 'moderator' | 'admin';

export interface Env {
  ALLOWED_ORIGINS: string;
  FIREBASE_PROJECT_ID: string;
  GCP_PROJECT_ID: string;
  GCP_SERVICE_ACCOUNT_JSON: string;
  ADMIN_BOOTSTRAP_SECRET: string;
}

export interface Variables {
  uid: string;
  role: Role;
}
