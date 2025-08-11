import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const financialData = sqliteTable("financial_data", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    jobId: text("job_id").notNull(),
    sheet: text("sheet").notNull(),
    data: text("data").notNull(), // store row as JSON string
    createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});
