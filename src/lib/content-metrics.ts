type ContentGenerationMetric = {
  repositoryFullName: string;
  durationMs: number;
  outcome: "success" | "failure";
  errorCode?: string;
  modelCalls: 1;
  structureValid: boolean;
};

type ContentFeedbackMetric = {
  repositoryFullName: string;
  feedback: "usable" | "needs-rewrite";
};

/**
 * 阶段 1 的最小指标采集：使用结构化服务端日志建立成功率、失败类型和延迟基线。
 * 阶段 2 再将这些事件接入持久化存储和评估报告。
 */
export function recordContentGenerationMetric(metric: ContentGenerationMetric) {
  console.info(JSON.stringify({ event: "content_generation", ...metric }));
}

/** 记录用户对生成草稿的主观可用性反馈。 */
export function recordContentFeedbackMetric(metric: ContentFeedbackMetric) {
  console.info(JSON.stringify({ event: "content_feedback", ...metric }));
}
