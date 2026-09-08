import type { ResearchResult, ResearchSource } from "@/lib/research";

const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-4.7-flash";
const RESEARCH_RESULT_SCHEMA = `{
  "summary": "用 2～3 句话概括项目定位、用途与价值",
  "targetUsers": ["适合的用户、团队或使用场景"],
  "coreCapabilities": ["一项可验证的核心能力"],
  "technicalHighlights": ["一项可验证的技术或工程亮点"],
  "contentAngles": ["一个适合内容创作的选题角度"],
  "risks": ["信息不足、限制或维护风险；没有则 []"],
  "evidence": [
    {
      "claim": "来自输入资料的可验证事实",
      "source": "repository"
    }
  ]
}`;

type ZhipuResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type ZhipuErrorCode =
  | "ZHIPU_NOT_CONFIGURED"
  | "ZHIPU_AUTH_ERROR"
  | "ZHIPU_UNAVAILABLE"
  | "ZHIPU_API_ERROR"
  | "MODEL_RESPONSE_INVALID";

export class ZhipuApiError extends Error {
  constructor(
    readonly code: ZhipuErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getResearchResultValidationError(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return "root value must be an object";
  }

  const result = value as Record<string, unknown>;

  if (typeof result.summary !== "string") {
    return "summary must be a string";
  }

  const stringArrayFields = [
    "targetUsers",
    "coreCapabilities",
    "technicalHighlights",
    "contentAngles",
    "risks",
  ] as const;

  for (const field of stringArrayFields) {
    if (!isStringArray(result[field])) {
      return `${field} must be an array of strings`;
    }
  }

  if (!Array.isArray(result.evidence)) {
    return "evidence must be an array";
  }

  for (const [index, item] of result.evidence.entries()) {
    if (!item || typeof item !== "object") {
      return `evidence[${index}] must be an object`;
    }

    const evidence = item as Record<string, unknown>;

    if (typeof evidence.claim !== "string") {
      return `evidence[${index}].claim must be a string`;
    }

    if (evidence.source !== "repository" && evidence.source !== "readme") {
      return `evidence[${index}].source must be repository or readme`;
    }
  }

  return null;
}

function logInvalidResearchResult(reason: string, content: string) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Zhipu invalid research result] ${reason}\n`, content.slice(0, 10_000));
  }
}

function parseResearchResult(content: string): ResearchResult {
  const json = content.trim().replace(/^```json\s*|\s*```$/g, "");
  let result: unknown;

  try {
    result = JSON.parse(json);
  } catch (error) {
    const reason = error instanceof Error ? `invalid JSON: ${error.message}` : "invalid JSON";
    logInvalidResearchResult(reason, content);
    throw new ZhipuApiError(
      "MODEL_RESPONSE_INVALID",
      "模型返回的研究结果不是有效 JSON",
      502,
    );
  }

  const validationError = getResearchResultValidationError(result);

  if (validationError) {
    logInvalidResearchResult(validationError, content);
    throw new ZhipuApiError(
      "MODEL_RESPONSE_INVALID",
      "模型返回的研究结果格式无效",
      502,
    );
  }

  return result as ResearchResult;
}

function getZhipuFailure(response: Response, payload: ZhipuResponse) {
  const providerMessage = payload.error?.message ?? "Zhipu API request failed";
  const normalizedMessage = providerMessage.toLowerCase();
  const isUnavailable =
    response.status === 429 ||
    response.status >= 500 ||
    ["访问量过大", "稍后再试", "繁忙", "busy", "overloaded"].some((keyword) =>
      normalizedMessage.includes(keyword),
    );

  if (response.status === 401 || response.status === 403) {
    return new ZhipuApiError("ZHIPU_AUTH_ERROR", "智谱 API 身份验证失败", 502);
  }

  if (isUnavailable) {
    return new ZhipuApiError("ZHIPU_UNAVAILABLE", "智谱模型当前繁忙，请稍后再试", 503);
  }

  return new ZhipuApiError("ZHIPU_API_ERROR", providerMessage, 502);
}

export async function generateResearch(source: ResearchSource): Promise<ResearchResult> {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    throw new ZhipuApiError(
      "ZHIPU_NOT_CONFIGURED",
      "ZHIPU_API_KEY is not configured",
      500,
    );
  }

  const response = await fetch(ZHIPU_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ZHIPU_MODEL ?? DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `你是一名严谨的开源项目研究员。只根据提供的仓库资料和 README 作答；无法验证的信息必须写入 risks，不能编造。

你必须只返回一个 JSON 对象，根对象必须严格符合以下结构：
${RESEARCH_RESULT_SCHEMA}

规则：
- 不要使用 Markdown 代码块。
- 不要使用 answer、data、result 或任何包装字段。
- 不要返回、复述或嵌套输入中的 repository、readme 或 source。
- 所有字段都必须存在；没有内容时使用空数组 []，不要省略字段。
- 所有面向用户的文本内容必须使用简体中文。
- evidence.source 只能是 repository 或 readme。`,
        },
        {
          role: "user",
          content: `以下是待分析资料。请生成研究结论，不要回显资料本身。\n\n<source>\n${JSON.stringify(source)}\n</source>`,
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ZhipuResponse;

  if (!response.ok) {
    throw getZhipuFailure(response, payload);
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new ZhipuApiError(
      "MODEL_RESPONSE_INVALID",
      "智谱模型返回了空内容",
      502,
    );
  }

  return parseResearchResult(content);
}
