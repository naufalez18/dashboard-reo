// db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";

// ganti "dashboard" -> "dashboard_v2" (bebas, yang penting unik)
export default new SQLDatabase("dashboard_v2", { migrations: "./migrations" });
