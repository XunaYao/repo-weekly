import { jsonError } from "@/lib/api-response";
import { parseContentRequest } from "@/lib/content";

export async function POST(request: Request) {
  // 注意: 这里的 request.json() 方法返回的是一个 Promise 对象，它会尝试解析请求体中的 JSON 数据。
  // 如果解析失败（例如请求体不是有效的 JSON），我们使用 .catch(() => null) 来捕获错误并返回 null，以避免抛出异常。
  // unknown： TypeScript 类型不会检查真实的 HTTP 请求内容。
  const body: unknown = await request.json().catch(() => null);
  try {
    const contentSource = parseContentRequest(body);
    if (!contentSource) {
      return jsonError("INVALID_CONTENT_SOURCE", "Invalid content generation source", 400);
    }
    return jsonError(
      "CONTENT_GENERATION_NOT_IMPLEMENTED",
      "Content generation is not implemented yet",
      501,
    );
  } catch (error) {
    console.error("Error handling content generation request:", error);
    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
