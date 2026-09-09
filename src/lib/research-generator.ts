import {
  isResearchResult,
  RESEARCH_RESULT_FORMAT,
  type ResearchResult,
  type ResearchSource,
} from "@/lib/research";
import { requestZhipuContent, ZhipuApiError } from "@/lib/zhipu";

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

  if (!isResearchResult(result)) {
    logInvalidResearchResult("result does not match the required structure", content);
    throw new ZhipuApiError(
      "MODEL_RESPONSE_INVALID",
      "模型返回的研究结果格式无效",
      502,
    );
  }

  return result;
}

export async function generateResearch(source: ResearchSource): Promise<ResearchResult> {
  const content = await requestZhipuContent({
    messages: [
      {
        role: "system",
        content: `你是一名严谨的开源项目研究员。只根据提供的仓库资料和 README 作答；无法验证的信息必须写入 risks，不能编造。

你必须只返回一个 JSON 对象，根对象必须严格符合以下结构：
${RESEARCH_RESULT_FORMAT}

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
  });

  return parseResearchResult(content);
}
