/**
 * User Store Factory & Repository Abstraction
 * Routes to PostgresUserStore in production/live environments and FileUserStore in local test suites.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { RegisterInput, UserProfile, UserRecord } from "./types";
import { hashPassword, verifyPassword } from "./password";
import { isDatabaseConfigured } from "../db/client";
import { PostgresUserStore } from "./postgres-user-store";

export interface IUserStore {
  createUser(input: RegisterInput): Promise<UserProfile>;
  authenticateUser(email: string, plainPassword: string): Promise<UserProfile | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserProfile | null>;
  getAllUsers(): Promise<UserProfile[]>;
}

export class FileUserStore implements IUserStore {
  private filePath: string;
  private memoryCache: Map<string, UserRecord> = new Map();
  private isLoaded = false;
  private readonly memoryOnly: boolean;

  constructor(filePath?: string) {
    // Playwright's production-mode local server must not add throwaway audit
    // accounts to the developer's JSON fixture. This switch is test-only and
    // does not weaken the production DATABASE_URL requirement.
    this.memoryOnly = process.env.E2E_MEMORY_ONLY === "true";
    this.filePath =
      filePath ||
      path.join(process.cwd(), "data", "users.json");
    if (!this.memoryOnly) this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), "utf8");
      }
    } catch {
      // In read-only serverless runtime, memory cache will be used
    }
  }

  private loadUsers(): void {
    if (this.isLoaded) return;

    if (this.memoryOnly) {
      this.isLoaded = true;
      return;
    }

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf8");
        const list = JSON.parse(raw) as UserRecord[];
        this.memoryCache.clear();
        for (const u of list) {
          this.memoryCache.set(u.email.toLowerCase(), u);
        }
      }
    } catch {
      // Keep existing memory cache
    }
    this.isLoaded = true;
  }

  private persistUsers(): void {
    if (this.memoryOnly) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.memoryCache.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(list, null, 2), "utf8");
      fs.renameSync(tempPath, this.filePath);
    } catch {
      // Disk write warning
    }
  }

  async createUser(input: RegisterInput): Promise<UserProfile> {
    this.loadUsers();
    const normalizedEmail = input.email.toLowerCase().trim();

    if (this.memoryCache.has(normalizedEmail)) {
      throw new Error("Email đã được đăng ký trên hệ thống.");
    }

    const { hash, salt } = hashPassword(input.password);
    const nowIso = new Date().toISOString();

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name: input.name.trim(),
      passwordHash: hash,
      salt,
      role: "user",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.memoryCache.set(normalizedEmail, newUser);
    this.persistUsers();

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  async authenticateUser(email: string, plainPassword: string): Promise<UserProfile | null> {
    this.loadUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.memoryCache.get(normalizedEmail);

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
    this.loadUsers();
    const normalizedEmail = email.toLowerCase().trim();
    return this.memoryCache.get(normalizedEmail) || null;
  }

  async findUserById(id: string): Promise<UserProfile | null> {
    this.loadUsers();
    for (const u of this.memoryCache.values()) {
      if (u.id === id) {
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        };
      }
    }
    return null;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    this.loadUsers();
    return Array.from(this.memoryCache.values()).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }
}

// Global user store singleton
let globalUserStore: IUserStore | null = null;

export function getUserStore(): IUserStore {
  if (globalUserStore) return globalUserStore;

  // 1. If DATABASE_URL is configured, use production PostgresUserStore
  if (isDatabaseConfigured()) {
    globalUserStore = new PostgresUserStore();
    return globalUserStore;
  }

  // 2. Strict check for production
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MEMORY_STORE !== "true") {
    throw new Error(
      "CRITICAL: DATABASE_URL is required in production environment. No database connection found."
    );
  }

  // 3. Fallback for test / dev when explicitly allowed
  globalUserStore = new FileUserStore();
  return globalUserStore;
}
