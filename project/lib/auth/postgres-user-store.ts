/**
 * PostgreSQL User Store Repository (Neon / Managed PostgreSQL)
 * Implements IUserStore interface using secure parameterized SQL queries.
 */

import crypto from "crypto";
import { IUserStore } from "./user-store";
import { RegisterInput, UserProfile, UserRecord } from "./types";
import { hashPassword, verifyPassword } from "./password";
import { query, queryOne } from "../db/client";

export class PostgresUserStore implements IUserStore {
  async createUser(input: RegisterInput): Promise<UserProfile> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check existing email
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Email đã được đăng ký trên hệ thống.");
    }

    const { hash, salt } = hashPassword(input.password);
    const userId = crypto.randomUUID();
    const role = "user";

    const sql = `
      INSERT INTO users (id, email, name, password_hash, salt, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, role, created_at AS "createdAt";
    `;

    const row = await queryOne<{
      id: string;
      email: string;
      name: string;
      role: "user" | "admin";
      createdAt: string;
    }>(sql, [userId, normalizedEmail, input.name.trim(), hash, salt, role]);

    if (!row) {
      throw new Error("Failed to insert user record into PostgreSQL.");
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  async authenticateUser(email: string, plainPassword: string): Promise<UserProfile | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      return null;
    }

    const isValid = verifyPassword(plainPassword, user.passwordHash, user.salt);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const sql = `
      SELECT
        id,
        email,
        name,
        password_hash AS "passwordHash",
        salt,
        role,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE email = $1;
    `;

    const row = await queryOne<any>(sql, [normalizedEmail]);
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      salt: row.salt,
      role: row.role,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  async findUserById(id: string): Promise<UserProfile | null> {
    const sql = `
      SELECT
        id,
        email,
        name,
        role,
        created_at AS "createdAt"
      FROM users
      WHERE id = $1;
    `;

    const row = await queryOne<any>(sql, [id]);
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const sql = `
      SELECT
        id,
        email,
        name,
        role,
        created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC;
    `;

    const rows = await query<any>(sql);
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }
}
