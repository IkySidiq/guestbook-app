import pg from "pg";
import { nanoid } from "nanoid";
import { NotFoundError } from "../../exceptions/NotFoundError";

const { Pool } = pg;

export class NotificationsService {
  constructor() {
    this._pool = new Pool();
  }

  async handlePaymentNotification(payload) {
    const client = await this._pool.connect();

    try {
      await client.query("BEGIN");

      // Misal payload dari gateway punya struktur:
      // { order_id, transaction_status, payment_type, fraud_status, ... }
      const { order_id, transaction_status } = payload;

      // Ambil booking
      const result = await client.query(
        `SELECT id, payment_status, status, user_id FROM bookings WHERE id = $1`,
        [order_id]
      );

      if (!result.rows.length) throw new NotFoundError("Booking tidak ditemukan");

      const booking = result.rows[0];

      // Cek status transaksi
      if (transaction_status === "settlement" || transaction_status === "capture") {
        // Update booking jadi paid / confirmed
        if (booking.payment_status !== "paid") {
          const updatedAt = new Date().toISOString();
          await client.query(
            `UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = $1 WHERE id = $2`,
            [updatedAt, order_id]
          );

          // Log aktivitas
          await client.query(
            `INSERT INTO active_logs (id, user_id, action, target_table, target_id, performed_at)
            VALUES ($1,$2,$3,$4,$5,$6)`,
            [`log-${nanoid(16)}`, booking.user_id, "pay booking via notification", "bookings", order_id, updatedAt]
          );
        }
      } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
        // Update booking jadi expired atau failed
        const updatedAt = new Date().toISOString();
        await client.query(
          `UPDATE bookings SET status = 'failed', updated_at = $1 WHERE id = $2`,
          [updatedAt, order_id]
        );

        await client.query(
          `INSERT INTO active_logs (id, user_id, action, target_table, target_id, performed_at)
          VALUES ($1,$2,$3,$4,$5,$6)`,
          [`log-${nanoid(16)}`, booking.user_id, "payment failed via notification", "bookings", order_id, updatedAt]
        );
      }

      await client.query("COMMIT");

      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database Error (handlePaymentNotification):", error);
      throw error;
    } finally {
      client.release();
    }
  }
}
