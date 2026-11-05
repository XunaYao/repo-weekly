import { jsonError } from "@/lib/api-response";
import { recordContentFeedbackMetric } from "@/lib/content-metrics";
import { isRecord } from "@/lib/validation";

type ContentFeedback = "usable" | "needs-rewrite";

type ContentFeedbackPayload = {
  repositoryFullName: string;
  feedback: ContentFeedback;
};

function isContentFeedback(value: unknown): value is ContentFeedbackPayload {
  if (!isRecord(value) || typeof value.repositoryFullName !== "string") {
    return false;
  }

  return value.feedback === "usable" || value.feedback === "needs-rewrite";
}

function parseContentFeedback(value: unknown): ContentFeedbackPayload | null {
  return isContentFeedback(value) ? value : null;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const feedback = parseContentFeedback(body);

  if (!feedback) {
    return jsonError("INVALID_CONTENT_FEEDBACK", "Invalid content feedback", 400);
  }

  recordContentFeedbackMetric(feedback);

  return Response.json({ data: { recorded: true } });
}
