import { execFileSync } from "node:child_process";
const base = process.env.PR_BASE_SHA;
const head = process.env.PR_HEAD_SHA;
if (!/^[a-f0-9]{40}$/.test(base ?? "") || !/^[a-f0-9]{40}$/.test(head ?? "")) throw new Error("Missing PR revisions");
const paths = execFileSync("git", ["diff", "--name-only", "-z", `${base}...${head}`], { encoding: "utf8" }).split("\0").filter(Boolean);
// Only internal documentation is exempt. Bundled Markdown, workflow and config changes require all checks.
const docsOnly = paths.length > 0 && paths.every(p => /^(docs\/.*\.(md|txt)|(?:AGENTS|CLAUDE|HANDOFF|README|PRODUCT|DESIGN|EXECUTION_PLAN)\.md)$/.test(p));
console.log(`docs_only=${docsOnly}`);
