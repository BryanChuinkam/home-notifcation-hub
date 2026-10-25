import { z } from "zod";

export const profileId = z.string().regex(/^[a-z0-9_]{1,64}$/);
export const notifyService = z.string().regex(/^[a-z0-9_]{1,128}$/).refine(value => !["notify", "send_message", "reload", "google_assistant_sdk", "html5"].includes(value));
export const tvPresentation = z.object({
  duration: z.number().int().min(1).max(60).default(10),
  position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left", "center"]).default("bottom-right"),
  fontsize: z.enum(["small", "medium", "large", "max"]).default("medium"),
  color: z.enum(["grey", "black", "indigo", "green", "red", "cyan", "teal", "amber", "pink"]).default("grey"),
  transparency: z.enum(["0%", "25%", "50%", "75%", "100%"]).default("25%"),
}).strict();
export const broadcastRooms = z.array(z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N} '\-]+$/u)).min(1).max(10).refine(rooms => new Set(rooms.map(room => room.toLowerCase())).size === rooms.length);
const name = z.string().trim().min(1).max(80).refine(value => !/[\x00-\x1f\x7f]/.test(value));
export const profilesSchema = z.array(z.discriminatedUnion("kind", [
  z.object({ id: profileId, name, kind: z.literal("android_tv"), service: notifyService, presentation: tvPresentation.default(() => tvPresentation.parse({})) }).strict(),
  z.object({ id: profileId, name, kind: z.literal("google_broadcast"), rooms: broadcastRooms }).strict(),
  z.object({ id: profileId, name, kind: z.literal("browser_push"), browser: z.string().regex(/^[a-z0-9_]{1,128}$/) }).strict(),
])).max(50).refine(profiles => new Set(profiles.map(profile => profile.id)).size === profiles.length)
  .refine(profiles => { const services = profiles.filter(profile => profile.kind === "android_tv").map(profile => profile.service); return new Set(services).size === services.length; });
export type DeviceProfile = z.infer<typeof profilesSchema>[number];
export function parseProfiles(raw: string | undefined): DeviceProfile[] {
  if (!raw?.trim()) return [];
  if (raw.length > 32768) throw new Error("Invalid device profiles");
  return profilesSchema.parse(JSON.parse(raw));
}
