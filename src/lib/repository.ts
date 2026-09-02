import type { CleanReadmeResult } from "@/lib/readme";

/** RepoWeekly 对外返回的仓库资料。 */
export type RepositoryData = {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  defaultBranch: string;
  updatedAt: string;
  readme?: CleanReadmeResult | null;
};

/** 送入模型、且不包含可由 fullName 推导字段的仓库资料。 */
export type ResearchRepositoryData = Omit<RepositoryData, "owner" | "name" | "readme">;
