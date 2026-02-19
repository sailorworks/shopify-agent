import { cookies } from "next/headers";

export const USER_ID_COOKIE = "shopify_user_id";

/**
 * Read the per-user userId from the request cookie.
 * The middleware guarantees this cookie always exists.
 */
export async function getUserIdFromRequest(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(USER_ID_COOKIE);
  if (!cookie?.value) {
    throw new Error("User ID cookie not found — middleware should have set it");
  }
  return cookie.value;
}
