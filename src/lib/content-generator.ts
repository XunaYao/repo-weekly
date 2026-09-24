import {
  getContentDraftValidationError,
  isContentDraftResult,
  type ContentDraftResult,
} from "@/lib/content";
import { ZhipuApiError } from "@/lib/zhipu";

function logInvalidContentDraft(reason: string, content: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Zhipu invalid content draft] ${reason}\n`, content.slice(0, 10_000));
  }
}

export function parseContentDraftResult(content: string): ContentDraftResult {
  const json = content.trim().replace(/^```json\s*|\s*```$/g, "");
  let result: unknown;

  try {
    result = JSON.parse(json);
  } catch (error) {
    const reason = error instanceof Error ? `invalid JSON: ${error.message}` : "invalid JSON";
    logInvalidContentDraft(reason, content);
    throw new ZhipuApiError("MODEL_RESPONSE_INVALID", "模型返回的内容草稿不是有效 JSON", 502);
  }

  if (!isContentDraftResult(result)) {
    const reason =
      getContentDraftValidationError(result) ?? "result does not match the required structure";
    logInvalidContentDraft(reason, content);
    throw new ZhipuApiError("MODEL_RESPONSE_INVALID", "模型返回的内容草稿格式无效", 502);
  }

  return result;
}
