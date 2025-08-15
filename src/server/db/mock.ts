import type { Preview, Team, User } from "./schema.ts";
import type { DuckDBConnection } from "@duckdb/node-api";

export const mockTeams: Team[] = [
    {
        id: 0,
        name: "CFO",
    },
    {
        id: 1,
        name: "Creditos",
    },
    {
        id: 2,
        name: "Investimentos",
    }
];

export const mockUsers: User[] = [
    {
        id: "t787845",
        email: "t787845@santander.com.br",
        name: "Arthur",
        team_id: 0,
        role: "cfo",
    },
];

export const mockPreviews: Preview[] = [
    {
        cod: 1,
        nom_cod: "Q1 Revenue",
        nom_seg: "Financial",
        team_name: "Finance Department",
        sheet_name: "Q1 2025",
        dat_ref: new Date("2025-03-31"),
        value: 1250000.75,
        version: 1,
        created_at: new Date("2025-04-05T09:15:00Z"),
    },
    {
        cod: 2,
        nom_cod: "Q1 Expenses",
        nom_seg: "Financial",
        team_name: "Finance Department",
        sheet_name: "Q1 2025",
        dat_ref: new Date("2025-03-31"),
        value: 780500.25,
        version: 1,
        created_at: new Date("2025-04-05T10:30:00Z"),
    },
    {
        cod: 3,
        nom_cod: "Q2 Revenue Forecast",
        nom_seg: "Forecasting",
        team_name: "Finance Department",
        sheet_name: "Forecasts 2025",
        dat_ref: new Date("2025-06-30"),
        value: 1450000.00,
        version: 2,
        created_at: new Date("2025-04-10T14:20:00Z"),
    },
];


export async function seedMockData(conn: DuckDBConnection) {
    for (const team of mockTeams) {
        await conn.run(
            `INSERT INTO teams (id, name) VALUES (?, ?)`,
            [team.id, team.name],
        );
    }
    for (const user of mockUsers) {
        await conn.run(
            `INSERT INTO users (id, email, name, team_id, role) VALUES (?, ?, ?, ?, ?)`,
            [user.id, user.email, user.name, user.team_id, user.role],
        );
    }
    for (const preview of mockPreviews) {
        await conn.run(
            `INSERT INTO preview (
                cod, nom_cod, nom_seg, team_name, sheet_name, dat_ref, value, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                preview.cod,
                preview.nom_cod,
                preview.nom_seg,
                preview.team_name,
                preview.sheet_name,
                preview.dat_ref.toISOString().split("T")[0],
                preview.value,
                preview.version,
            ],
        );
    }
}