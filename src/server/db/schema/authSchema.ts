// Auth DB schema for DuckDB
export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,         -- employee id
  name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  role TEXT NOT NULL           -- 'cfo' or 'external'
);
`

export const CREATE_TEAMS_TABLE = `
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
`
