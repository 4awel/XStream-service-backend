/**
 * username попадает в адрес канала (/<username>), поэтому не может совпадать
 * с маршрутами приложения и «служебными» словами, которыми удобно выдавать себя
 * за администрацию.
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "browse",
  "categories",
  "category",
  "channel",
  "dashboard",
  "directory",
  "following",
  "friends",
  "help",
  "login",
  "logout",
  "media",
  "messages",
  "payments",
  "moderator",
  "onboarding",
  "register",
  "root",
  "search",
  "settings",
  "signup",
  "subscriptions",
  "support",
  "system",
  "user",
  "xstream",
]);
