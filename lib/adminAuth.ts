import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const isAdminRequest = (request: NextRequest): boolean => {
  const token = request.headers.get("x-admin-token");
  return token !== null && token === env.ADMIN_SECRET;
};
