import { Request, Response, NextFunction } from "express";
import cors from "cors";

const parseAllowedOrigins =
  () => {
    return (
      process.env
        .ALLOWED_ORIGINS ||
        "http://localhost:5173"
      // "https://ca0f-150-129-146-122.ngrok-free.app"
    )
      .split(",")
      .map((origin) =>
        origin.trim()
      )
      .filter(Boolean);
  };

export const corsMiddleware = cors({
  origin:
    parseAllowedOrigins(),
  credentials: true,
});


export const bigintSerializer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    const safeData = JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint"
          ? value.toString()
          : value
      )
    );

    return originalJson.call(this, safeData);
  };

  next();
};
