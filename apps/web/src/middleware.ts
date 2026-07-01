export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/chat/:path*", "/api/conversations/:path*", "/api/chat"],
};
