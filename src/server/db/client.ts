import { drizzle } from "drizzle-orm/better-sqlite3";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const db = createClient({
  url: "file:my-local.db",
});



const sqlite = new Database("finhub.sqlite");

export const db = drizzle(sqlite, { schema });
