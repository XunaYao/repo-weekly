import { generateResearch, ZhipuApiError } from "@/lib/zhipu";
import { jsonError } from "@/lib/api-response";
import type { ResearchSource } from "@/lib/research";

function isResearchSource(value: unknown): value is ResearchSource {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Record<string, unknown>;
  const repository = source.repository;
  const readme = source.readme;

  if (!repository || typeof repository !== "object") {
    return false;
  }

  const data = repository as Record<string, unknown>;
  const hasValidReadme =
    readme === null ||
    (typeof readme === "object" &&
      readme !== null &&
      typeof (readme as Record<string, unknown>).content === "string" &&
      typeof (readme as Record<string, unknown>).truncated === "boolean");

  return (
    typeof data.fullName === "string" &&
    (typeof data.description === "string" || data.description === null) &&
    typeof data.url === "string" &&
    typeof data.stars === "number" &&
    typeof data.forks === "number" &&
    typeof data.openIssues === "number" &&
    (typeof data.language === "string" || data.language === null) &&
    Array.isArray(data.topics) &&
    data.topics.every((topic) => typeof topic === "string") &&
    typeof data.defaultBranch === "string" &&
    typeof data.updatedAt === "string" &&
    hasValidReadme
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const source =
      body && typeof body === "object"
        ? (body as { source?: unknown }).source
        : undefined;

    if (!isResearchSource(source)) {
      return jsonError("INVALID_RESEARCH_SOURCE", "Invalid repository research source", 400);
    }

    const data = await generateResearch(source);

    return Response.json({ data });
  } catch (error) {
    if (error instanceof ZhipuApiError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("Error generating repository research:", error);

    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
