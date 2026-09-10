import type { RepositoryData } from "@/lib/repository";
import type { ResearchResult } from "@/lib/research";

/** 生成多平台内容草稿所需的最小可信资料。 */
export type ContentSource = {
  repository: Pick<RepositoryData, "fullName" | "url" | "description" | "language" | "topics">;
  research: ResearchResult;
};

/** 微信公众号文章草稿。 */
export type WechatDraft = {
  title: string;
  digest: string;
  body: string;
  callToAction: string;
};

/** 小红书图文草稿。 */
export type XiaohongshuDraft = {
  title: string;
  body: string;
  hashtags: string[];
};

/** 一次生成得到的全部平台草稿。 */
export type ContentDraftResult = {
  wechat: WechatDraft;
  xiaohongshu: XiaohongshuDraft;
};
