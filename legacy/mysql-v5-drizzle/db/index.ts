import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { getSqlPool } from "../lib/sql-database";

export function getDb() {
  return drizzle(getSqlPool(), { schema, mode: "default" });
}
