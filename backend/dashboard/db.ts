import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create the dashboard database
export const dashboardDB = new SQLDatabase("dashboard", {
  migrations: "./migrations",
});
