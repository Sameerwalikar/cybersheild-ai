import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError, UnauthorizedError } from "../../utils/AppError.js";
import { authRepository } from "./auth.repository.js";
import type { RegisterInput, LoginInput } from "./auth.validator.js";
import type { Role } from "@prisma/client";
import crypto from "crypto";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthResult {
  user: { id: string; email: string; role: string; name: string };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new AppError("Email already registered", 409, "DUPLICATE_EMAIL");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      role: input.role as Role,
      name: input.name,
    });

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    await authRepository.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.profile?.name || input.name },
      ...tokens,
    };
  },

  async login(input: LoginInput, meta?: { userAgent?: string; ip?: string }): Promise<AuthResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is suspended", 403, "ACCOUNT_SUSPENDED");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });

    await authRepository.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ip,
    });

    await authRepository.updateLastLogin(user.id);

    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.profile?.name || "" },
      ...tokens,
    };
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await authRepository.findSessionByToken(refreshToken);
    if (!session) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (session.expiresAt < new Date()) {
      await authRepository.deleteSession(session.id);
      throw new UnauthorizedError("Refresh token expired");
    }

    // Rotate refresh token
    await authRepository.deleteSession(session.id);

    const tokens = generateTokens({ id: session.user.id, email: session.user.email, role: session.user.role });

    await authRepository.createSession({
      userId: session.user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return tokens;
  },

  async logout(refreshToken: string): Promise<void> {
    await authRepository.deleteSessionByToken(refreshToken);
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError("User not found");

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.profile?.name || "",
      phone: user.profile?.phone,
      avatar: user.profile?.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  },

  async forgotPassword(_email: string): Promise<{ message: string }> {
    // Placeholder — would send email with reset token
    return { message: "If an account exists, a reset link has been sent." };
  },

  async resetPassword(_token: string, _password: string): Promise<{ message: string }> {
    // Placeholder — would validate token and update password
    return { message: "Password has been reset successfully." };
  },
};

function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as unknown as number | undefined });
  const refreshToken = crypto.randomBytes(40).toString("hex");
  return { accessToken, refreshToken };
}
