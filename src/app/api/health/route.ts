export function GET() {
  return Response.json({ status: "ok", service: "home-notification-hub", stage: "foundation" }, { headers: { "Cache-Control": "no-store" } });
}
