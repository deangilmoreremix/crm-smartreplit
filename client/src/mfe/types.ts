/**
 * Module Federation Types
 */

export interface FederationRemote {
  url: string;
  module: string;
}

export interface FederationConfig {
  name: string;
  filename: string;
  exposes: Record<string, string>;
  shared: string[];
}
