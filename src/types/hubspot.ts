// Connection status (no enums per codebase convention)
export type HubSpotConnectionStatus = "connected" | "disconnected" | "expired" | "error";

// Database row type
export type HubSpotConnection = {
  id: string;
  user_id: string;
  portal_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scopes: string[];
  connected_at: string;
  updated_at: string;
};

// Client-safe connection info (no tokens exposed)
export type HubSpotConnectionInfo = {
  status: HubSpotConnectionStatus;
  portalId: string | null;
  connectedAt: string | null;
  scopes: string[];
};

// OAuth token response from HubSpot
export type HubSpotTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

// Internal token data after processing
export type TokenData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

// HubSpot Contact from API
export type HubSpotContact = {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    company?: string;
    hs_linkedin_url?: string;
    linkedin_url?: string; // Alias some portals use
  };
  createdAt: string;
  updatedAt: string;
};

// Pagination response from HubSpot
export type HubSpotContactsResponse = {
  results: HubSpotContact[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
};

// Normalized contact for our app
export type NormalizedHubSpotContact = {
  hubspotId: string;
  name: string;
  email: string | null;
  company: string | null;
  linkedinUrl: string | null;
};

// Import request body
export type HubSpotImportRequest = {
  contacts: NormalizedHubSpotContact[];
};

// Import response
export type HubSpotImportResponse = {
  imported: number;
  skipped: number;
  skippedEmails: string[];
};
