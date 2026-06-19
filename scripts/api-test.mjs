import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const baseUrl = (process.env.API_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const authToken = process.env.API_TEST_AUTH_TOKEN || "";
const cnr = process.env.API_TEST_CNR || "";
const inviteId =
  process.env.API_TEST_INVITE_ID || "00000000-0000-4000-8000-000000000000";
const inviteEmail = process.env.API_TEST_INVITE_EMAIL || "";
const cronSecret = process.env.API_TEST_CRON_SECRET || "";
const enableInviteMutation = process.env.API_TEST_ENABLE_INVITE_MUTATION === "1";

const results = [];

function isLocalBaseUrl() {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl);
}

function uniqueEmail(prefix = "api-test") {
  return `${prefix}+${Date.now()}@example.com`;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
    delete options.json;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers,
  });

  const text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    text,
    json,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function responseSummary(result) {
  if (result.json) return JSON.stringify(result.json);
  if (result.text) return result.text.slice(0, 240);
  return "empty response";
}

function assertResponseStatus(result, expected) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert(
    allowed.includes(result.status),
    `Expected status ${allowed.join(" or ")}, received ${result.status}. Body: ${responseSummary(result)}`
  );
}

function assertJsonObject(result) {
  assert(result.json && typeof result.json === "object", "Expected a JSON object response");
}

async function test(name, fn, options = {}) {
  const started = Date.now();

  if (options.skip) {
    results.push({
      name,
      status: "skipped",
      durationMs: 0,
      details: options.skip,
    });
    return;
  }

  try {
    await fn();
    results.push({
      name,
      status: "passed",
      durationMs: Date.now() - started,
    });
  } catch (error) {
    results.push({
      name,
      status: options.allowFailure ? "warning" : "failed",
      durationMs: Date.now() - started,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function authHeaders(token = authToken) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

await test("API server is reachable", async () => {
  const result = await request("/api/waitlist", {
    method: "POST",
    json: { website: "bot-field", name: "", email: "" },
  });

  assertResponseStatus(result, 200);
});

await test("POST /api/waitlist accepts honeypot silently", async () => {
  const result = await request("/api/waitlist", {
    method: "POST",
    json: { website: "filled-by-bot", name: "", email: "" },
  });

  assertResponseStatus(result, 200);
  assertJsonObject(result);
  assert(result.json.ok === true, "Expected ok=true for honeypot response");
});

await test("POST /api/waitlist rejects missing required fields", async () => {
  const result = await request("/api/waitlist", {
    method: "POST",
    json: { name: "", email: "bad-email" },
  });

  assertResponseStatus(result, 400);
  assertJsonObject(result);
  assert(typeof result.json.error === "string", "Expected error message");
});

await test("POST /api/waitlist accepts a valid lead", async () => {
  const result = await request("/api/waitlist", {
    method: "POST",
    headers: { "User-Agent": "DocketHQ API test" },
    json: {
      name: "API Test Lead",
      email: uniqueEmail("waitlist"),
      city: "Bengaluru",
      practice_type: "solo",
      source: "api-test",
    },
  });

  assertResponseStatus(result, 200);
  assertJsonObject(result);
  assert(result.json.ok === true, "Expected ok=true");
}, { allowFailure: true });

await test("POST /api/fetch-case rejects missing auth", async () => {
  const result = await request("/api/fetch-case", {
    method: "POST",
    json: { cnr: "ABCDEF1234567890" },
  });

  assertResponseStatus(result, 401);
  assertJsonObject(result);
  assert(result.json.code === "UNAUTHORIZED", "Expected UNAUTHORIZED code");
});

await test("POST /api/fetch-case rejects invalid CNR", async () => {
  const result = await request("/api/fetch-case", {
    method: "POST",
    headers: authHeaders(),
    json: { cnr: "bad" },
  });

  assertResponseStatus(result, 400);
  assertJsonObject(result);
  assert(result.json.success === false, "Expected success=false");
  assert(result.json.code === "INVALID_CNR", "Expected INVALID_CNR");
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test authenticated validation.",
});

await test("POST /api/fetch-case handles malformed JSON without crashing", async () => {
  const result = await request("/api/fetch-case", {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: "{",
  });

  assertResponseStatus(result, [400, 500]);
  assertJsonObject(result);
  if (result.status === 500) {
    throw new Error("Malformed JSON currently returns 500; prefer a 400 validation response.");
  }
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test malformed JSON past auth.",
  allowFailure: true,
});

await test("POST /api/fetch-case returns live court data", async () => {
  const result = await request("/api/fetch-case", {
    method: "POST",
    headers: authHeaders(),
    json: { cnr },
  });

  assertResponseStatus(result, 200);
  assertJsonObject(result);
  assert(result.json.success === true, "Expected success=true");
  assert(result.json.data?.cnrNumber, "Expected normalized case data");
}, {
  skip:
    (!authToken || !cnr) &&
    "Set API_TEST_AUTH_TOKEN and API_TEST_CNR to run live court lookup.",
  allowFailure: true,
});

await test("POST /api/auth/session-marker rejects missing auth", async () => {
  const result = await request("/api/auth/session-marker", {
    method: "POST",
  });

  assertResponseStatus(result, 401);
  assertJsonObject(result);
  assert(typeof result.json.error === "string", "Expected error message");
});

await test("POST /api/auth/session-marker sets cookie for valid token", async () => {
  const result = await request("/api/auth/session-marker", {
    method: "POST",
    headers: authHeaders(),
  });

  assertResponseStatus(result, 204);
  assert(
    result.headers.get("set-cookie")?.includes("dockethq_session=active"),
    "Expected dockethq_session cookie"
  );
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test session cookie creation.",
});

await test("DELETE /api/auth/session-marker clears cookie", async () => {
  const result = await request("/api/auth/session-marker", {
    method: "DELETE",
  });

  assertResponseStatus(result, 204);
  assert(
    result.headers.get("set-cookie")?.includes("dockethq_session="),
    "Expected dockethq_session clearing cookie"
  );
});

await test("POST /api/invites rejects missing auth", async () => {
  const result = await request("/api/invites", {
    method: "POST",
    json: { email: uniqueEmail("invite"), role: "lawyer" },
  });

  assertResponseStatus(result, 401);
  assertJsonObject(result);
});

await test("POST /api/invites rejects invalid email for authenticated user", async () => {
  const result = await request("/api/invites", {
    method: "POST",
    headers: authHeaders(),
    json: { email: "bad-email", role: "lawyer" },
  });

  assertResponseStatus(result, 400);
  assertJsonObject(result);
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test authenticated invite validation.",
});

await test("POST /api/invites rejects invalid role for authenticated user", async () => {
  const result = await request("/api/invites", {
    method: "POST",
    headers: authHeaders(),
    json: { email: uniqueEmail("invite"), role: "owner" },
  });

  assertResponseStatus(result, 400);
  assertJsonObject(result);
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test authenticated role validation.",
});

await test("POST /api/invites creates an invite when enabled", async () => {
  const result = await request("/api/invites", {
    method: "POST",
    headers: authHeaders(),
    json: { email: inviteEmail || uniqueEmail("invite"), role: "lawyer" },
  });

  assertResponseStatus(result, 200);
  assertJsonObject(result);
  assert(result.json.invite?.id, "Expected invite id");
  assert(result.json.invite_link, "Expected invite_link");
}, {
  skip:
    (!authToken || !enableInviteMutation) &&
    "Set API_TEST_AUTH_TOKEN and API_TEST_ENABLE_INVITE_MUTATION=1 to create a live invite.",
  allowFailure: true,
});

await test("GET /api/invites/:id returns 404 for unknown invite", async () => {
  const result = await request(`/api/invites/${inviteId}`, {
    method: "GET",
  });

  assertResponseStatus(result, 404);
  assertJsonObject(result);
}, { allowFailure: true });

await test("POST /api/invites/:id rejects missing auth", async () => {
  const result = await request(`/api/invites/${inviteId}`, {
    method: "POST",
  });

  assertResponseStatus(result, 401);
  assertJsonObject(result);
});

await test("POST /api/invites/:id handles authenticated missing invite", async () => {
  const result = await request(`/api/invites/${inviteId}`, {
    method: "POST",
    headers: authHeaders(),
  });

  assertResponseStatus(result, 404);
  assertJsonObject(result);
}, {
  skip: !authToken && "Set API_TEST_AUTH_TOKEN to test authenticated invite acceptance errors.",
  allowFailure: true,
});

await test("GET /api/reminders/send-due rejects missing cron auth on deployed apps", async () => {
  const result = await request("/api/reminders/send-due", {
    method: "GET",
  });

  if (isLocalBaseUrl() && result.status !== 401) {
    results.push({
      name: "GET /api/reminders/send-due local auth note",
      status: "warning",
      durationMs: 0,
      details:
        "Local development allows reminder cron without CRON_SECRET. Keep CRON_SECRET configured in production.",
    });
    return;
  }

  assertResponseStatus(result, 401);
  assertJsonObject(result);
});

await test("GET /api/reminders/send-due runs with cron secret", async () => {
  const result = await request("/api/reminders/send-due", {
    method: "GET",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  assertResponseStatus(result, 200);
  assertJsonObject(result);
  assert(typeof result.json.processed === "number", "Expected processed count");
  assert(Array.isArray(result.json.results), "Expected results array");
}, {
  skip:
    !cronSecret &&
    "Set API_TEST_CRON_SECRET to run the due-reminder cron endpoint.",
  allowFailure: true,
});

const counts = results.reduce(
  (acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  },
  {}
);

const reportLines = [
  "# DocketHQ API Test Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Base URL: ${baseUrl}`,
  "",
  "## Summary",
  "",
  `- Passed: ${counts.passed || 0}`,
  `- Failed: ${counts.failed || 0}`,
  `- Warnings: ${counts.warning || 0}`,
  `- Skipped: ${counts.skipped || 0}`,
  "",
  "## Results",
  "",
  "| Status | Test | Duration | Details |",
  "| --- | --- | ---: | --- |",
  ...results.map((result) => {
    const details = result.details ? String(result.details).replace(/\|/g, "\\|") : "";
    return `| ${result.status.toUpperCase()} | ${result.name} | ${result.durationMs}ms | ${details} |`;
  }),
  "",
  "## Recommendations",
  "",
  "- Provide `API_TEST_AUTH_TOKEN` from a dedicated test user before running authenticated checks.",
  "- Provide `API_TEST_CNR` only for a CNR you are authorized to test.",
  "- Keep `API_TEST_ENABLE_INVITE_MUTATION` off unless you intentionally want to create a live invite.",
  "- Run against local first, then against the Vercel deployment using `API_TEST_BASE_URL`.",
  "",
];

const reportPath = resolve("docs/api-test-report.md");
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, reportLines.join("\n"), "utf8");

for (const result of results) {
  const icon =
    result.status === "passed"
      ? "PASS"
      : result.status === "skipped"
        ? "SKIP"
        : result.status === "warning"
          ? "WARN"
          : "FAIL";
  console.log(`${icon} ${result.name}${result.details ? ` - ${result.details}` : ""}`);
}

console.log("");
console.log(`Report written to ${reportPath}`);

if ((counts.failed || 0) > 0) {
  process.exitCode = 1;
}
