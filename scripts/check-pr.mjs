import { readFileSync } from "node:fs";
import { validRoute } from "./pr-route.mjs";
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const pr = event.pull_request;
if (!pr || !validRoute(pr.base.ref, pr.head.ref, pr.head.repo?.full_name === pr.base.repo.full_name)) {
  console.error("Invalid PR route: task branches target staging; only same-repository staging targets main.");
  process.exit(1);
}
console.log("PR routing passed");
