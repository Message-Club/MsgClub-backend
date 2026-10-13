// controllers/auth.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET as string;

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET as string;
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// =========================
// REGISTER
// =========================
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: "",
        lastName: "",
        isSuperuser: false,
        isStaff: false,
        isActive: true,
        dateJoined: new Date(),

        profile: {
          create: {
            status: "offline",
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// LOGIN
// =========================
export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },

      include: {
        profile: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ACCESS TOKEN
    const accessToken = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
      },

      ACCESS_SECRET,

      {
        expiresIn: "15m",
      }
    );

    // REFRESH TOKEN
    const refreshToken = jwt.sign(
      {
        id: user.id.toString(),
      },

      REFRESH_SECRET,

      {
        expiresIn: "7d",
      }
    );

    // store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,

        userId: user.id,

        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        lastLogin: new Date(),
      },
    });

    return res.status(200).json({
      message: "Login successful",

      access_token: accessToken,

      refresh_token: refreshToken,

      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// REFRESH ACCESS TOKEN
// =========================
export const refreshAccessToken = async (
  req: Request,
  res: Response
) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        message: "Refresh token required",
      });
    }

    // check DB token
    const storedToken =
      await prisma.refreshToken.findFirst({
        where: {
          token: refresh_token,

          revoked: false,

          expiresAt: {
            gt: new Date(),
          },
        },

        include: {
          user: true,
        },
      });

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // verify jwt
    const decoded = jwt.verify(
      refresh_token,
      REFRESH_SECRET
    ) as {
      id: string;
    };

    // create new access token
    const accessToken = jwt.sign(
      {
        id: decoded.id,
        email: storedToken.user.email,
      },

      ACCESS_SECRET,

      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      access_token: accessToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

// =========================
// LOGOUT
// =========================

export const logout = async (
  req: Request,
  res: Response
) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await prisma.refreshToken.updateMany({
        where: {
          token: refresh_token,
        },

        data: {
          revoked: true,
        },
      });
    }

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// PROFILE
// =========================
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.user.id);

    const profile = await prisma.profile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// UPDATE PROFILE
// =========================
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.user.id);

    const {
      firstName,
      lastName,
      username,
      avatar,
      status,
    } = req.body;

    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUsername) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName,
        lastName,
        username,
      },
    });

    const profile = await prisma.profile.update({
      where: {
        userId,
      },
      data: {
        avatar,
        status,
      },
      include: {
        user: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// UPDATE PASSWORD
// =========================
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.user.id);

    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// FORGOT PASSWORD
// =========================
export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate 6-digit code
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash code before storing
    const codeHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    // Expiry: 10 mins
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Invalidate previous unused codes
    await prisma.passwordResetCode.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Store new code
    await prisma.passwordResetCode.create({
      data: {
        codeHash,
        expiresAt,
        userId: user.id,
      },
    });

    // TODO:
    // Send code via email/SMS

    return res.status(200).json({
      message: "Reset code generated",
      code, // remove in production
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// RESET PASSWORD
// =========================
export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        message: "email, code and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const resetCode =
      await prisma.passwordResetCode.findFirst({
        where: {
          userId: user.id,
          codeHash,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

    if (!resetCode) {
      return res.status(400).json({
        message: "Invalid or expired code",
      });
    }

    // Prevent brute force
    if (resetCode.attempts >= 5) {
      return res.status(400).json({
        message: "Too many attempts",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetCode.update({
      where: {
        id: resetCode.id,
      },
      data: {
        used: true,
      },
    });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// USER LIST
// =========================
export const getUsers = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
      skip,
      take: limit,
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    return res.status(200).json({
      count: total,
      page,
      limit,
      results: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};