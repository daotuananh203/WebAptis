/**
 * User Authentication & Session Domain Types
 */

import { z } from "zod";

export const UserRoleSchema = z.enum(["user", "admin"]).default("user");
export type UserRole = z.infer<typeof UserRoleSchema>;

const CleanEmailSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
  z.string().email("Email không hợp lệ")
);

export const RegisterInputSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không quá 50 ký tự"),
  email: CleanEmailSchema,
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: CleanEmailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export const AUTH_COOKIE_NAME = "aptis_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
