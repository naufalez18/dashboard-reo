import { SQLDatabase } from "encore.dev/storage/sqldb";

// Ganti nama resource DB agar unik (hindari bentrok sebelumnya)
export const dashboardDB = new SQLDatabase("dashboard_v2", {
  migrations: "./migrations",
});
