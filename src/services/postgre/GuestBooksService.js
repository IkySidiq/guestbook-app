import { nanoid } from "nanoid";
import pg from "pg";
import { InvariantError } from "../../exceptions/InvariantError.js";
import { NotFoundError } from "../../exceptions/NotFoundError.js";
import { mapDBToModelBooks } from "../../utils/index.js";
const { Pool } = pg;

export class GuestBooksService {
  constructor() {
    this._pool = new Pool();
  }

  async addGuestBook({ userId, address, purpose, institution, totalGuest, contactInfo }) {
    const client = await this._pool.connect();
    
    try {
    const id = `book-${nanoid(16)}`;
    const activeLogId = `log-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const checkIn = createdAt;
    const updatedAt = createdAt;
    
    await client.query('BEGIN');
    const query = {
      text: `INSERT INTO guest_books (id, address, purpose, institution, accepted_by, total_guest, check_in, created_at, updated_at, contact_info)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      values: [id, address, purpose, institution, userId, totalGuest, checkIn, createdAt, updatedAt, contactInfo],
    }

    const result = await client.query(query);
    if (!result.rows.length) {
      throw new InvariantError("Gagal menambahkan buku");
    }

    const targetId = result.rows[0]?.id;

    const activeLogsQuery = {
      text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      values: [activeLogId, userId, "create", "guest_books", targetId, createdAt],
    }

    const resultOfActiveLogQuery = await client.query(activeLogsQuery);
    if (!resultOfActiveLogQuery.rows.length) {
       throw new InvariantError("Gagal mencatat log aktivitas");
    }
    
    await client.query('COMMIT');

    return {
      id: targetId,
      logId: resultOfActiveLogQuery.rows[0]?.id
    }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addGuestMember({ guestId, name }) {
    const id = `member-${nanoid(16)}`;

    try {
      const query = {
        text: `INSERT INTO guest_members (id, guest_id, name, contact_info)
          VALUES ($1, $2, $3, $4) RETURNING id`,
        values: [id, guestId, name]
      }

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak valid")
      }
      
      return {
        memberId: result.rows[0]?.id
      }
    } catch(error) {
      console.error("Database Error(deleteBook):", error);
      throw new Error("Gagal menyimpan data pengguna");
    }
  }

  async getGuestBooks({ status, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      const whereValues = [];

      if (status) {
        conditions.push(`status = $${whereValues.length + 1}`);
        whereValues.push(status);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const paginationValues = [limit, offset];
      const query = {
        text: `
          SELECT created_at, institution, status, check_in, check_out, total_guest
          FROM guest_books
          ${whereClause}
          LIMIT $${whereValues.length + 1}
          OFFSET $${whereValues.length + 2}
        `,
        values: [...whereValues, ...paginationValues],
      };

      const result = await this._pool.query(query);
      const books = result.rows.map(mapDBToModelBooks);

      const countQuery = {
        text: `SELECT COUNT(*) FROM guest_books ${whereClause}`,
        values: whereValues,
      };

      const countResult = await this._pool.query(countQuery);
      const totalItems = parseInt(countResult.rows[0]?.count, 10);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: books,
        page,
        limit,
        totalItems,
        totalPages,
      };
    } catch (error) {
      console.error("Database Error (getAllGuestBooks):", error);
      throw new Error("Gagal mengambil daftar tamu");
    }
  }

  async getBookById({ targetId }) {
    try {
      const query = {
        text: `SELECT id, address, purpose, created_at, institution, accepted_by, status, check_out, check_in, total_guest
          FROM guest_books WHERE id = $1`,
        values: [targetId],
      }

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError("Buku tidak ditemukan");
      }

      return  result.rows[0]
    } catch (error) {
        console.error("Database Error (getBookById):", error);
        throw new Error("Gagal mengambil data tamu");
    }
  }

  async editBook({ targetId, userId, address, purpose, institution, totalGuest }) {
    const activeLogId = `log-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const client = await this._pool.connect();

    try {      
      await client.query('BEGIN');

      const query = {
        text: 'UPDATE guest_books SET address = $1, purpose = $2, institution = $3, total_guest = $4, updated_at = $5 WHERE id = $6 RETURNING id',
        values: [address, purpose, institution, totalGuest, updatedAt, targetId]
      }

      const result = await client.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak ditemukan. Gagal mengedit buku tamu");
      }

      const resultTargetId = result.rows[0]?.id;

      const activeLogsQuery = {
        text: `
          INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [activeLogId, userId, "edit", "guest_books", resultTargetId, createdAt],
      };

      const resultOfLogQuery = await client.query(activeLogsQuery);

      if (!resultOfLogQuery.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query('COMMIT');

      return {
        id: resultTargetId,
        logId: resultOfLogQuery.rows[0].id
      }
    } catch(error) {
      await client.query('ROLLBACK');
      console.error("Database Error(editBook):", error);
      throw new Error("Gagal mengedit data buku tamu");
    } finally {
      client.release();
    }
  }

  async deleteBook({  userId, targetId }) {
    const client = await this._pool.connect();
    try {
      const activeLogId = `log-${nanoid(16)}`;
      const createdAt = new Date().toISOString();

      await client.query("BEGIN");

      const query = {
        text : `DELETE FROM guest_books WHERE id = $1 RETURNING id`,
        values: [targetId],
      }

      const result = await client.query(query);
      
      if (!result.rows.length) {
        throw new InvariantError("Data tidak ditemukan. Buku tamu gagal dihapus")
      }

      const resultTargetId = result.rows[0]?.id;

      const activeLogsQuery = {
        text: `
          INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [activeLogId, userId, "delete", "guest_books", resultTargetId, createdAt]
      }

      const resultOfActiveLogQuery = await client.query(activeLogsQuery);

      if (!resultOfActiveLogQuery.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query('COMMIT');

      return {
        id: targetId,
        logId: resultOfActiveLogQuery.rows[0]?.id
      }
    } catch(error) {
      await client.query('ROLLBACK');
      console.error("Database Error(deleteBook):", error);
      throw new Error("Gagal menghapus data pengguna");
    } finally {
      client.release();
    }
  }

  async finishGuestBook({ targetId, userId }) {
    const activeLogId = `log-${nanoid(16)}`;
    const updatedAt = new Date().toISOString();
    const client = await this._pool.connect();

    try {
      await client.query('BEGIN');

      const updateQuery = {
        text: `UPDATE guest_books SET status = $1, updated_at = $2 WHERE id = $3 RETURNING id`,
        values: ["selesai", updatedAt, targetId],
      };

      const result = await client.query(updateQuery);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak ditemukan. Gagal memperbarui status buku tamu");
      }

      const updatedId = result.rows[0]?.id;

      const logQuery = {
        text: `INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
              VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        values: [activeLogId, userId, 'finish', 'guest_books', updatedId, updatedAt],
      };

      const logResult = await client.query(logQuery);

      if (!logResult.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query('COMMIT');

      return {
        id: updatedId,
        logId: logResult.rows[0].id,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database Error (finishGuestBook):', error);
      throw new Error('Gagal memperbarui status buku tamu');
    } finally {
      client.release();
    }
  }

  async addGuestMembersBulk({ guestId, members, totalGuest }) {
    const client = await this._pool.connect();

    try {
      await client.query('BEGIN');

      for (const member of members) {
        const id = `member-${nanoid(16)}`;
        const query = {
          text: `INSERT INTO guest_members (id, guest_id, name, total_guest)
                VALUES ($1, $2, $3, $4)`,
          values: [id, guestId, member.name, totalGuest],
        };

        await client.query(query);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database Error (addGuestMembersBulk):', error);
      throw new Error('Gagal menambahkan tamu');
    } finally {
      client.release();
    }
  }
}