import type { RepositoryData } from "@/lib/repository";
import { isResearchResult, type ResearchResult } from "@/lib/research";
import { isRecord, isStringArray } from "@/lib/validation";

/** 生成多平台内容草稿所需的最小可信资料。 */
export type ContentSource = {
  /** 展示项目名称、链接和技术标签所需的精简仓库信息。 */
  repository: Pick<RepositoryData, "fullName" | "url" | "description" | "language" | "topics">;

  /** 上一步生成且已经通过结构校验的项目研究结果。 */
  research: ResearchResult;
};

/** 微信公众号文章草稿。 */
export type WechatDraft = {
  /** 微信文章标题。 */
  title: string;

  /** 用于消息列表和分享卡片的文章摘要。 */
  digest: string;

  /** 微信文章正文，允许使用 Markdown 表达结构。 */
  body: string;

  /** 引导读者访问项目、收藏或参与讨论的结尾文案。 */
  callToAction: string;
};

/** 小红书图文草稿。 */
export type XiaohongshuDraft = {
  /** 小红书笔记标题。 */
  title: string;

  /** 小红书笔记正文。 */
  body: string;

  /** 不带额外结构的主题标签文本数组。 */
  hashtags: string[];
};

/** 一次生成得到的全部平台草稿。 */
export type ContentDraftResult = {
  /** 微信公众号渠道的文章草稿。 */
  wechat: WechatDraft;

  /** 小红书渠道的图文草稿。 */
  xiaohongshu: XiaohongshuDraft;
};

/** 提示大模型严格返回的内容草稿 JSON 结构。 */
export const CONTENT_DRAFT_RESULT_FORMAT = `{
  "wechat": {
    "title": "微信公众号文章标题",
    "digest": "用于消息列表和分享卡片的文章摘要",
    "body": "结构完整的微信公众号文章正文",
    "callToAction": "引导读者访问项目、收藏或参与讨论的结尾文案"
  },
  "xiaohongshu": {
    "title": "小红书笔记标题",
    "body": "适合小红书阅读习惯的笔记正文",
    "hashtags": ["主题标签"]
  }
}`;

function isContentRepository(value: unknown): value is ContentSource["repository"] {
  return (
    isRecord(value) &&
    typeof value.fullName === "string" &&
    typeof value.url === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.language === "string" || value.language === null) &&
    isStringArray(value.topics)
  );
}

/**
 * 从接口请求体中提取可信的内容生成输入。
 *
 * 未通过完整结构校验时返回 null，调用方不应把未经校验的原始请求传给模型。
 */
export function parseContentRequest(value: unknown): ContentSource | null {
  if (!isRecord(value) || !isRecord(value.source)) {
    return null;
  }

  const { repository, research } = value.source;

  return isContentRepository(repository) && isResearchResult(research)
    ? { repository, research }
    : null;
}

/**
 * 返回模型结果中第一个不符合数据契约的原因；返回 null 表示校验通过。
 *
 * 这段诊断信息适合记录在服务端日志中，便于定位模型输出格式问题。
 */
export function getContentDraftValidationError(value: unknown): string | null {
  if (!isRecord(value)) {
    return "Content draft result must be an object";
  }

  if (!isRecord(value.wechat)) {
    return "wechat must be an object";
  }

  const wechatStringFields = ["title", "digest", "body", "callToAction"] as const;
  for (const field of wechatStringFields) {
    if (typeof value.wechat[field] !== "string") {
      return `wechat.${field} must be a string`;
    }
  }

  if (!isRecord(value.xiaohongshu)) {
    return "xiaohongshu must be an object";
  }

  const xiaohongshuStringFields = ["title", "body"] as const;
  for (const field of xiaohongshuStringFields) {
    if (typeof value.xiaohongshu[field] !== "string") {
      return `xiaohongshu.${field} must be a string`;
    }
  }

  if (!isStringArray(value.xiaohongshu.hashtags)) {
    return "xiaohongshu.hashtags must be an array of strings";
  }

  return null;
}

/** 判断未知值是否是完整、可消费的多平台内容草稿。 */
export function isContentDraftResult(value: unknown): value is ContentDraftResult {
  return getContentDraftValidationError(value) === null;
}
