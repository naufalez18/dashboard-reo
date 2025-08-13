import { SQLDatabase } from "encore.dev/storage/sqldb";

// Reference the imported database
export const dashboardDB = new SQLDatabase("dashboard", {
  migrations: "./migrations",
});
