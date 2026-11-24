import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, safeEqual } from "./adminToken";

export async function isAdmin() {
  const t = await adminToken();
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!t && !!c && safeEqual(c, t);
}
