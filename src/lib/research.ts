import type { CleanReadmeResult } from "@/lib/readme";
import type { ResearchRepositoryData } from "@/lib/repository";

/** 项目可以在哪些编程语言、工具和运行环境中使用。 */
export type ProjectCompatibility = {
  /** 项目是否限制目标项目的编程语言；unknown 表示现有资料无法判断。 */
  scope: "language-agnostic" | "language-specific" | "unknown";

  /** scope 为 language-specific 时列出明确支持的目标项目语言。 */
  supportedLanguages: string[];

  /** 项目明确支持或集成的编辑器、AI Agent、框架或宿主工具。 */
  supportedTools: string[];

  /** 使用该项目所需的运行时、版本、账号或其他前置条件。 */
  requirements: string[];

  /** 无法用以上字段表达的兼容性限制或补充说明。 */
  notes: string[];
};

export type ResearchResult = {
  /** 项目的产品或技术类别，例如前端框架、CLI 工具、数据库或 AI 应用。 */
  projectType: string;

  /** 项目的目标语言兼容性、支持工具及使用要求。 */
  compatibility: ProjectCompatibility;

  /** 面向不了解该项目的读者，用 2～3 句话说明项目的定位、用途与价值。 */
  summary: string;

  /** 项目最适合哪些人、团队或具体使用场景。 */
  targetUsers: string[];

  /** 项目提供的关键能力，每项使用一句完整、可独立阅读的描述。 */
  coreCapabilities: string[];

  /** 值得关注的技术选型、架构特点或工程实践。 */
  technicalHighlights: string[];

  /** 可进一步创作成文章、短帖或视频的内容选题角度。 */
  contentAngles: string[];

  /** 信息不足、维护状态不明或使用时需要留意的风险与限制。 */
  risks: string[];

  /** 每条结论对应的可验证事实及其来源，避免生成无依据的内容。 */
  evidence: Array<{
    /** 从仓库元数据或 README 中提炼出的事实性陈述。 */
    claim: string;

    /** 该事实来自 GitHub 仓库元数据，还是 README 正文。 */
    source: "repository" | "readme";
  }>;
};

export type ResearchSource = {
  /** 仓库的基础资料，用于为研究结论提供可验证的上下文。 */
  repository: ResearchRepositoryData;

  /** 已清理的 README 正文；仓库不存在 README 时为 null。 */
  readme: CleanReadmeResult | null;
};

export const RESEARCH_RESULT_FORMAT = `{
  "projectType": "项目类型，例如前端框架、CLI 工具、数据库或 AI 应用",
  "compatibility": {
    "scope": "language-agnostic | language-specific | unknown",
    "supportedLanguages": ["仅在 language-specific 时列出明确支持的目标项目语言"],
    "supportedTools": ["明确支持或集成的工具、框架或宿主环境"],
    "requirements": ["运行时、版本、账号或其他前置条件"],
    "notes": ["兼容性限制或补充说明"]
  },
  "summary": "用 2～3 句话概括项目定位、用途与价值",
  "targetUsers": ["适合的用户、团队或使用场景"],
  "coreCapabilities": ["一项可验证的核心能力"],
  "technicalHighlights": ["一项可验证的技术或工程亮点"],
  "contentAngles": ["一个适合内容创作的选题角度"],
  "risks": ["信息不足、限制或维护风险；没有则 []"],
  "evidence": [{ "claim": "来自输入资料的可验证事实", "source": "repository" }]
}`;

const repositoryStringFields = ["fullName", "url", "defaultBranch", "updatedAt"] as const;
const repositoryNumberFields = ["stars", "forks", "openIssues"] as const;
const resultStringArrayFields = [
  "targetUsers",
  "coreCapabilities",
  "technicalHighlights",
  "contentAngles",
  "risks",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResearchRepository(value: unknown): value is ResearchRepositoryData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    repositoryStringFields.every((field) => typeof value[field] === "string") &&
    repositoryNumberFields.every((field) => typeof value[field] === "number") &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.language === "string" || value.language === null) &&
    isStringArray(value.topics)
  );
}

function isReadme(value: unknown): value is CleanReadmeResult {
  return (
    isRecord(value) && typeof value.content === "string" && typeof value.truncated === "boolean"
  );
}

function isEvidence(value: unknown): value is ResearchResult["evidence"][number] {
  return (
    isRecord(value) &&
    typeof value.claim === "string" &&
    (value.source === "repository" || value.source === "readme")
  );
}

function isCompatibility(value: unknown): value is ProjectCompatibility {
  if (!isRecord(value) || !isStringArray(value.supportedLanguages)) {
    return false;
  }

  const hasValidLanguageList =
    value.scope === "language-specific"
      ? value.supportedLanguages.length > 0
      : value.supportedLanguages.length === 0;

  return (
    (value.scope === "language-agnostic" ||
      value.scope === "language-specific" ||
      value.scope === "unknown") &&
    hasValidLanguageList &&
    isStringArray(value.supportedTools) &&
    isStringArray(value.requirements) &&
    isStringArray(value.notes)
  );
}

export function parseResearchRequest(value: unknown): ResearchSource | null {
  if (!isRecord(value) || !isRecord(value.source)) {
    return null;
  }

  const { repository, readme } = value.source;

  return isResearchRepository(repository) && (readme === null || isReadme(readme))
    ? { repository, readme }
    : null;
}

export function isResearchResult(value: unknown): value is ResearchResult {
  return (
    isRecord(value) &&
    typeof value.projectType === "string" &&
    isCompatibility(value.compatibility) &&
    typeof value.summary === "string" &&
    resultStringArrayFields.every((field) => isStringArray(value[field])) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidence)
  );
}
