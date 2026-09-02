export type ResearchResult = {
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
import type { CleanReadmeResult } from "@/lib/readme";
import type { ResearchRepositoryData } from "@/lib/repository";
