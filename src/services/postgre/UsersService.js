import pg from "pg";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { InvariantError } from "../../exceptions/InvariantError.js";
import { AuthenticationError } from "../../exceptions/AuthenticationError.js";
import { AuthorizationError } from "../../exceptions/AuthorizationError.js";

const { Pool } = pg;

export class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUserService({ name, position, username, password }) {
    const userId = `user-${nanoid(16)}`;
    const activeLogId = `log-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const client = await this._pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.verifyUsername({ username });

      await client.query('BEGIN');

      const query = {
        text: `
          INSERT INTO users (id, name, position, username, hashed_password, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `,
        values: [userId, name, position, username, hashedPassword, createdAt, updatedAt],
      };

      const result = await client.query(query);
      if (!result.rows.length) {
        throw new InvariantError("Gagal menambahkan data pengguna");
      }

      const targetId = result.rows[0].id;

      const activeLogsQuery = {
        text: `
          INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [activeLogId, targetId, "create", "users", targetId, createdAt],
      };

      const resultOfActiveLogQuery = await client.query(activeLogsQuery);
      if (!resultOfActiveLogQuery.rows.length) {
        throw new InvariantError("Gagal mencatat log aktivitas");
      }

      await client.query('COMMIT');

      return {
        id: targetId,
        logId: resultOfActiveLogQuery.rows[0].id,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyUsername({ username }) {
    const query = {
      text: `SELECT username FROM users WHERE username = $1`,
      values: [username],
    };

    const result = await this._pool.query(query);
    if (result.rows.length) {
      throw new InvariantError("Username sudah digunakan");
    }
  }

  async verifyUserCredential({ username, password }) {
    const query = {
      text: `SELECT id, hashed_password FROM users WHERE username = $1`,
      values: [username]
    }

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new AuthenticationError("Kredensial yang anda berikan salah");
    }

    const { id, hashed_password: hashedPassword  } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError("Kredensial yang anda berikan salah");
    }

    return id;
  }

  async verifyUser({ userId }) {
    const query = {
      text: `SELECT role FROM users WHERE id = $1`,
      values: [userId]
    }

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("Data tidak ditemukan");
    }

    if (result.rows[0].role !== "admin") {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }

    return {
      role: result.rows[0].role,
    }
  }

  async getAllUsers({ page = 1, limit = 10, position, role }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ['is_active = true'];
      const values = [];

      if (position) {
        conditions.push(`position = $${values.length + 1}`);
        values.push(position);
      }

      if (role) {
        conditions.push(`role = $${values.length + 1}`);
        values.push(role);
      }

      const paramCount = values.length;

      values.push(limit); 
      values.push(offset);

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = {
        text: `
          SELECT id, name, username, position, role
          FROM users
          ${whereClause}
          ORDER BY name ASC
          LIMIT $${paramCount + 1}
          OFFSET $${paramCount + 2}
        `,
        values,
      };

      const result = await this._pool.query(query);
      const users = result.rows;

      const countQuery = {
        text: `SELECT COUNT(*) FROM users ${whereClause}`,
        values: values.slice(0, paramCount),
      };

      const countResult = await this._pool.query(countQuery);
      const totalItems = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: users,
        page,
        limit,
        totalItems,
        totalPages,
      };
    } catch (error) {
      console.error("Database Error (getAllUsers):", error);
      throw new Error("Gagal mengambil data pengguna");
    }
  }


  async editUser({ targetId, name, position, username, password, userId }) {
    const activeLogId = `log-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const client = await this._pool.connect();
    try{
      const hashedPassword = await bcrypt.hash(password, 10)

      await client.query('BEGIN');
      
      const query = {
        text: `UPDATE users SET name = $1, position = $2, username = $3, hashed_password = $4, updated_at = $5 WHERE id = $6 RETURNING id`,
        values: [name, position, username, hashedPassword, updatedAt, targetId]
      }

      const result = await client.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak ditemukan. Gagal untuk mengedit");
      }

      const resultTargetId = result.rows[0].id;

      const activeLogsQuery = {
        text: `
          INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [activeLogId, userId, "edit", "users", resultTargetId, createdAt],
      };

      const resultOfLogQuery = await this._pool.query(activeLogsQuery);

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
      console.error("Database Error(editUser):", error);
      throw new Error("Gagal mengedit data pengguna");
    } finally {
      client.release();
    }
  }

  async deleteUser({ userId, targetId }) {
    const activeLogId = `log-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const client = await this._pool.connect();
    try{
      await client.query('BEGIN');

      const query = {
        text: `DELETE FROM users WHERE id = $1 RETURNING id`,
        values: [targetId]
      }

      const result = await client.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Data tidak ditemukan. Gagal menghapus data");
      }

      const resultTargetId = result.rows[0].id;

      const activeLogsQuery = {
        text: `
          INSERT INTO active_logs (id, user_id, action, target_table, target_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [activeLogId, userId, "delete", "users", resultTargetId, createdAt],
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
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Database Error(deleteUser):", error);
      throw new Error("Gagal menghapus data pengguna");
    } finally {
      client.release();
    }
  }

  async getRole({ userId }) {
    const query = {
      text: `SELECT role FROM users WHERE id = $1`,
      values: [userId]
    }

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("Role tidak ditemukan. Role tidak dapat diakses")
    }

    return result.rows[0].role;
  }

    async getPosition({ userId }) {
    const query = {
      text: `SELECT position FROM users WHERE id = $1`,
      values: [userId]
    }

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("Position tidak ditemukan. Position tidak dapat diakses")
    }

    return result.rows[0].position;
  }
}
