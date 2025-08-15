export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  team_id SMALLINT NOT NULL REFERENCES teams(id),
  role TEXT DEFAULT 'cfo'                 -- 'cfo' | 'external'
);
`;

export interface User {
  id: string;
  email: string;
  name: string;
  team_id: number;
  role: "cfo" | "external";
}

export const CREATE_TEAMS_TABLE = `
CREATE TABLE IF NOT EXISTS teams (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL
);
`;

export interface Team {
    id: number;
    name: string;
}

export const CREATE_PREVIEW_TABLE = `
CREATE TABLE IF NOT EXISTS preview (
  cod SMALLINT PRIMARY KEY,
  nom_cod TEXT NOT NULL,
  nom_seg TEXT NOT NULL,
  team_name TEXT NOT NULL,
  sheet_name TEXT NOT NULL,
  dat_ref DATE NOT NULL,
  value DECIMAL(38, 10) NOT NULL,
  version SMALLINT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export interface Preview {
    cod: number;
    nom_cod: string;
    nom_seg: string;
    team_name: string;
    sheet_name: string;
    dat_ref: Date;
    value: number;
    version: number;
    created_at?: Date;
}