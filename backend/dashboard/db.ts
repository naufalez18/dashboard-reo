import { SQLDatabase } from "encore.dev/storage/sqldb";

export const dashboardDB = new SQLDatabase("dashboard", {
  migrations: "./migrations",
});
