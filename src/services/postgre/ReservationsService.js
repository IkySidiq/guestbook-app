import { nanoid } from "nanoid";
import pg from "pg";
import { InvariantError } from "../../exceptions/InvariantError.js";
const { Pool } = pg;

export class ReservationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addReservation({ userId, name, contactInfo, purpose, institution, reservationDate }) {
    const id = `reservation-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const activeLogId = `log-${nanoid(16)}`;

    const client = await this._pool.connect();
    try {
      await client.query("BEGIN");

      const query = {
        text: `INSERT INTO reservations (id, name, contact_info, purpose, institution, reservation_date, created_at, updated_at, created_by )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        values: [id, name, contactInfo, purpose, institution, reservationDate, createdAt, updatedAt, userId],
      };

      const result = await client.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak valid");
      }

      const targetId = result.rows[0]?.id;

      const activeLogsQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        values: [activeLogId, userId, "create", "reservations", targetId, createdAt],
      };

      const resultOfActiveLogQuery = await client.query(activeLogsQuery);
      if (!resultOfActiveLogQuery.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query("COMMIT");

      return {
        id: targetId,
        logId: resultOfActiveLogQuery.rows[0]?.id,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database Error(addReservation):", error);
      throw new Error("Gagal menyimpan data pengguna");
    } finally {
      client.release();
    }
  }

  async getReservations({ status, page = 1, limit = 10 }) {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const paginationValues = [limit, offset];
    const query = {
      text: `
        SELECT id, name, institution, reservation_date, created_by
        FROM reservations
        ${whereClause}
        ORDER BY reservation_date ASC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      values: [...values, ...paginationValues],
    };

    const result = await this._pool.query(query);

    const reservations = result.rows; // atau result.rows.map(mapDBToModel);

    const countQuery = {
      text: `SELECT COUNT(*) FROM reservations ${whereClause}`,
      values: values,
    };

    const countResult = await this._pool.query(countQuery);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: reservations,
      page,
      limit,
      totalItems,
      totalPages,
    };
  } catch (error) {
    console.error("Database Error (getReservations):", error);
    throw new Error("Gagal mengambil daftar reservasi");
  }
  }

  async getReservationById({ targetId }) {
    try {
      const query = {
        text: `
          SELECT id, name, contact_info, purpose, institution, reservation_date, created_at, updated_at, created_by
          FROM reservations
          WHERE id = $1
        `,
        values: [targetId],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError("Reservasi tidak ditemukan");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Database Error (getReservationById):", error);
      throw new Error("Gagal mengambil data reservasi");
    }
  }

  async editReservation({ id, userId, name, contactInfo, purpose, institution, reservationDate }) {
    const createdAt = new Date().toISOString();
    const activeLogId = `log-${nanoid(16)}`;

    const client = await this._pool.connect();
    try {
      await client.query("BEGIN");

      const updateQuery = {
        text: `UPDATE reservations SET
                name = $1,
                contact_info = $2,
                purpose = $3,
                institution = $4,
                reservation_date = $5,
                updated_at = $6
              WHERE id = $7
              RETURNING id`,
        values: [name, contactInfo, purpose, institution, reservationDate, updatedAt, id],
      };

      const result = await client.query(updateQuery);

      if (!result.rows.length) {
        throw new InvariantError("Reservasi tidak ditemukan atau data tidak berubah");
      }

      const activeLogsQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        values: [activeLogId, userId, "update", "reservations", id, createdAt],
      };

      const logResult = await client.query(activeLogsQuery);
      if (!logResult.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query("COMMIT");

      return {
        id: result.rows[0].id,
        logId: logResult.rows[0].id,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database Error(editReservation):", error);
      throw new Error("Gagal mengupdate data reservasi");
    } finally {
      client.release();
    }
  }

  async deleteReservation(id, userId) {
    const createdAt = new Date().toISOString();
    const activeLogId = `log-${nanoid(16)}`;

    const client = await this._pool.connect();
    try {
      await client.query("BEGIN");

      const deleteQuery = {
        text: `DELETE FROM reservations WHERE id = $1 RETURNING id`,
        values: [id],
      };

      const result = await client.query(deleteQuery);

      if (!result.rows.length) {
        throw new InvariantError("Reservasi tidak ditemukan");
      }

      const activeLogsQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        values: [activeLogId, userId, "delete", "reservations", id, createdAt],
      };

      const logResult = await client.query(activeLogsQuery);
      if (!logResult.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query("COMMIT");

      return {
        id: result.rows[0].id,
        logId: logResult.rows[0].id,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database Error(deleteReservation):", error);
      throw new Error("Gagal menghapus data reservasi");
    } finally {
      client.release();
    }
  }

  async markAsVisited({ reservationId, userId }) {
    const client = await this._pool.connect();
    const activeLogId1 = `log-${nanoid(16)}`; 
    const activeLogId2 = `log-${nanoid(16)}`; 
    const now = new Date().toISOString();

    try {
      await client.query('BEGIN');

      const getReservationQuery = {
        text: `SELECT id, contact_info, purpose, institution, created_by, address 
              FROM reservations WHERE id = $1 AND status != 'selesai'`,
        values: [reservationId],
      };
      const reservationResult = await client.query(getReservationQuery);

      if (!reservationResult.rows.length) {
        throw new InvariantError('Reservasi tidak ditemukan atau sudah selesai');
      }

      const reservation = reservationResult.rows[0];

      const guestBookId = `book-${nanoid(16)}`;
      const insertGuestBookQuery = {
        text: `INSERT INTO guest_books 
              (id, address, purpose, institution, accepted_by, total_guest, check_in, created_at, updated_at, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '$10')`,
        values: [
          guestBookId,
          reservation.address,
          reservation.purpose,
          reservation.institution,
          userId,
          1,
          now,
          now,
          now,
          'sedang bertamu'
        ],
      };
      await client.query(insertGuestBookQuery);

      const logGuestBookQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [activeLogId1, userId, 'create', 'guest_books', guestBookId, now],
      };
      await client.query(logGuestBookQuery);

      const updateReservationQuery = {
        text: `UPDATE reservations SET status = 'selesai', updated_at = $1 WHERE id = $2`,
        values: [now, reservationId],
      };
      await client.query(updateReservationQuery);

      const logReservationQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [activeLogId2, userId, 'update', 'reservations', reservationId, now],
      };
      await client.query(logReservationQuery);

      await client.query('COMMIT');

      return { guestBookId, reservationId };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database Error (markAsVisited):', error);
      throw new Error('Gagal memproses reservasi menjadi tamu');
    } finally {
      client.release();
    }
  }
}
