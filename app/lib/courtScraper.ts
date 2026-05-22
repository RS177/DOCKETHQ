import { createHash } from "crypto";

type CourtCaseStatus = "pending" | "disposed" | "dismissed" | "stayed" | "unknown";

export type NormalizedCourtCase = {
  cnrNumber: string;
  caseTitle: string | null;
  status: CourtCaseStatus;
  statusLabel: string;
  isDisposed: boolean;
  isDismissed: boolean;
  nextHearingDate: string | null;
  currentStage: string | null;
  courtName: string | null;
  judgeName: string | null;
  latestUpdate: string;
  source: "ecourtsindia_api";
  sourceUrl: string;
  fetchedAt: string;
};

export type CourtFetchResult =
  | {
      success: true;
      data: NormalizedCourtCase;
      rawPayload: Record<string, unknown>;
      payloadHash: string;
    }
  | {
      success: false;
      error: string;
      code:
        | "INVALID_CNR"
        | "PROVIDER_NOT_CONFIGURED"
        | "PROVIDER_FAILED"
        | "CASE_NOT_FOUND";
      officialSearchUrl: string;
      data: null;
    };

const OFFICIAL_ECOURTS_CNR_URL =
  "https://services.ecourts.gov.in/ecourtindia_v6/";

function hashPayload(payload: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function cleanCnr(cnr: string) {
  return cnr.replace(/[\s-]/g, "").trim().toUpperCase();
}

function isValidCnr(cnr: string) {
  return /^[A-Z0-9]{16}$/.test(cnr);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function pickNestedRecord(payload: Record<string, unknown>) {
  const candidates = [
    payload.data,
    payload.case,
    payload.caseDetails,
    payload.case_details,
    payload.result,
    payload,
  ];

  for (const candidate of candidates) {
    const record = asRecord(candidate);

    if (Object.keys(record).length > 0) {
      return record;
    }
  }

  return payload;
}

function normalizeDate(value: string | null) {
  if (!value) return null;

  const isoLike = value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoLike) return isoLike;

  const indianDate = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (indianDate) {
    const [, day, month, year] = indianDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function inferStatus(statusText: string | null): {
  status: CourtCaseStatus;
  isDisposed: boolean;
  isDismissed: boolean;
} {
  const normalized = (statusText || "").toLowerCase();

  if (normalized.includes("dismiss")) {
    return { status: "dismissed", isDisposed: true, isDismissed: true };
  }

  if (
    normalized.includes("disposed") ||
    normalized.includes("closed") ||
    normalized.includes("decided")
  ) {
    return { status: "disposed", isDisposed: true, isDismissed: false };
  }

  if (normalized.includes("stay") || normalized.includes("stayed")) {
    return { status: "stayed", isDisposed: false, isDismissed: false };
  }

  if (normalized.includes("pending") || normalized.includes("active")) {
    return { status: "pending", isDisposed: false, isDismissed: false };
  }

  return { status: "unknown", isDisposed: false, isDismissed: false };
}

function normalizeCourtPayload(
  cnrNumber: string,
  payload: Record<string, unknown>
): NormalizedCourtCase {
  const record = pickNestedRecord(payload);
  const statusLabel =
    pickString(record, [
      "caseStatus",
      "case_status",
      "currentStatus",
      "current_status",
      "status",
      "statusLabel",
    ]) || "Status unavailable";

  const status = inferStatus(statusLabel);
  const caseTitle =
    pickString(record, ["caseTitle", "case_title", "title", "caseName"]) ||
    [pickString(record, ["petitioner", "petitionerName"]), pickString(record, ["respondent", "respondentName"])]
      .filter(Boolean)
      .join(" vs. ") ||
    null;

  const currentStage = pickString(record, [
    "stage",
    "caseStage",
    "case_stage",
    "currentStage",
    "purpose",
    "business",
  ]);
  const nextHearingDate = normalizeDate(
    pickString(record, [
      "nextHearingDate",
      "next_hearing_date",
      "nextDate",
      "next_date",
      "hearingDate",
    ])
  );
  const latestUpdate =
    pickString(record, ["latestUpdate", "latest_update", "lastOrder", "last_order"]) ||
    `${statusLabel}${currentStage ? ` · ${currentStage}` : ""}`;

  return {
    cnrNumber,
    caseTitle,
    status: status.status,
    statusLabel,
    isDisposed: status.isDisposed,
    isDismissed: status.isDismissed,
    nextHearingDate,
    currentStage,
    courtName: pickString(record, ["courtName", "court_name", "court", "courtComplex"]),
    judgeName: pickString(record, ["judgeName", "judge_name", "judge", "presidingJudge"]),
    latestUpdate,
    source: "ecourtsindia_api",
    sourceUrl: "https://ecourtsindia.com/api",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFromEcourtsIndiaApi(cnrNumber: string): Promise<CourtFetchResult> {
  const apiKey = process.env.ECOURTSINDIA_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error:
        "Automatic court lookup needs a court-data API key. Official eCourts CNR search uses CAPTCHA, so Dockethq cannot silently scrape it from the server.",
      code: "PROVIDER_NOT_CONFIGURED",
      officialSearchUrl: OFFICIAL_ECOURTS_CNR_URL,
      data: null,
    };
  }

  const response = await fetch(
    `https://webapi.ecourtsindia.com/api/partner/case/${cnrNumber}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    return {
      success: false,
      error:
        pickString(payload, ["message", "error", "detail"]) ||
        "The court-data provider could not fetch this CNR.",
      code: response.status === 404 ? "CASE_NOT_FOUND" : "PROVIDER_FAILED",
      officialSearchUrl: OFFICIAL_ECOURTS_CNR_URL,
      data: null,
    };
  }

  const data = normalizeCourtPayload(cnrNumber, payload);

  return {
    success: true,
    data,
    rawPayload: payload,
    payloadHash: hashPayload(payload),
  };
}

export async function fetchCourtCase(cnr: string): Promise<CourtFetchResult> {
  const cnrNumber = cleanCnr(cnr);

  if (!isValidCnr(cnrNumber)) {
    return {
      success: false,
      error: "Enter a valid 16-character CNR number.",
      code: "INVALID_CNR",
      officialSearchUrl: OFFICIAL_ECOURTS_CNR_URL,
      data: null,
    };
  }

  return fetchFromEcourtsIndiaApi(cnrNumber);
}
