import { jsonError } from "@/lib/api-response";
import { parseContentRequest } from "@/lib/content";
import { generateContent } from "@/lib/content-generator";
import { recordContentGenerationMetric } from "@/lib/content-metrics";
import { ZhipuApiError } from "@/lib/zhipu";

export async function POST(request: Request) {
  const startedAt = performance.now();
  let repositoryFullName: string | null = null;
  let modelCalls = 0;
  let receivedContent = false;

  try {
    const body: unknown = await request.json().catch(() => null);
    const contentSource = parseContentRequest(body);

    if (!contentSource) {
      return jsonError("INVALID_CONTENT_SOURCE", "Invalid content generation source", 400);
    }

    repositoryFullName = contentSource.repository.fullName;
    const data = await generateContent(contentSource, {
      onRequest: () => {
        modelCalls += 1;
      },
      onResponse: () => {
        receivedContent = true;
      },
    });

    recordContentGenerationMetric({
      repositoryFullName,
      durationMs: Math.round(performance.now() - startedAt),
      outcome: "success",
      modelCalls,
      structureValid: true,
    });

    return Response.json({ data });
  } catch (error) {
    const zhipuError = error instanceof ZhipuApiError ? error : null;

    if (repositoryFullName) {
      recordContentGenerationMetric({
        repositoryFullName,
        durationMs: Math.round(performance.now() - startedAt),
        outcome: "failure",
        errorCode: zhipuError?.code ?? "INTERNAL_ERROR",
        modelCalls,
        structureValid: receivedContent ? false : null,
      });
    }

    if (zhipuError) {
      return jsonError(zhipuError.code, zhipuError.message, zhipuError.status);
    }

    console.error("Error handling content generation request:", error);
    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
