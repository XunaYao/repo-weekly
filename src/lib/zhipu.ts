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

export class ZhipuApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResearchResult(value: unknown): value is ResearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.summary === "string" &&
    isStringArray(result.targetUsers) &&
    isStringArray(result.coreCapabilities) &&
    isStringArray(result.technicalHighlights) &&
    isStringArray(result.contentAngles) &&
    isStringArray(result.risks) &&
    Array.isArray(result.evidence) &&
    result.evidence.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).claim === "string" &&
        ["repository", "readme"].includes((item as Record<string, unknown>).source as string),
    )
  );
}

function parseResearchResult(content: string): ResearchResult {
  const json = content.trim().replace(/^```json\s*|\s*```$/g, "");

  try {
    const result: unknown = JSON.parse(json);

    if (isResearchResult(result)) {
      return result;
    }
  } catch {
    // The error below gives callers a stable, provider-independent failure message.
  }

  throw new ZhipuApiError("Model returned an invalid research result", 502);
}

export async function generateResearch(source: ResearchSource): Promise<ResearchResult> {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    throw new ZhipuApiError("ZHIPU_API_KEY is not configured", 500);
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
    throw new ZhipuApiError(payload.error?.message ?? "Zhipu API request failed", 502);
  }


  const content = payload.choices?.[0]?.message?.content;

  console.log("[Zhipu raw content]\n", content);

  if (!content) {
    throw new ZhipuApiError("Zhipu API returned an empty response", 502);
  }

  return parseResearchResult(content);
}
