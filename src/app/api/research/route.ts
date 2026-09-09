import { jsonError } from "@/lib/api-response";
import { generateResearch } from "@/lib/research-generator";
import { parseResearchRequest } from "@/lib/research";
import { ZhipuApiError } from "@/lib/zhipu";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const source = parseResearchRequest(body);

    if (!source) {
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
