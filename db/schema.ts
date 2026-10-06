import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  serviceId: integer("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("confirmed"),
  emailStatus: text("email_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("appointments_slot_unique").on(table.appointmentDate, table.appointmentTime),
]);
