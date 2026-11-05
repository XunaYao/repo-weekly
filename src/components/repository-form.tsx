"use client";

import { FormEvent, useState } from "react";
import { ContentDrafts } from "@/components/content-drafts";
import { ResearchResult } from "@/components/research-result";
import type { ContentDraftResult, ContentSource } from "@/lib/content";
import type { RepositoryData } from "@/lib/repository";
import type { ResearchResult as ResearchResultData, ResearchSource } from "@/lib/research";

type RepositoryInput = {
  owner: string;
  name: string;
};

type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

type ResearchStatus = "idle" | "loadingRepository" | "generatingResearch";
type ContentFeedback = "usable" | "needs-rewrite";

function parseGitHubRepository(value: string): RepositoryInput | null {
  try {
    const url = new URL(value.trim());
    const [owner, repositoryName, ...extraSegments] = url.pathname.split("/").filter(Boolean);

    if (url.hostname !== "github.com" || !owner || !repositoryName || extraSegments.length > 0) {
      return null;
    }

    return {
      owner,
      name: repositoryName.replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function createResearchSource(repository: RepositoryData): ResearchSource {
  const researchRepository: ResearchSource["repository"] = {
    fullName: repository.fullName,
    description: repository.description,
    url: repository.url,
    stars: repository.stars,
    forks: repository.forks,
    openIssues: repository.openIssues,
    language: repository.language,
    topics: repository.topics,
    defaultBranch: repository.defaultBranch,
    updatedAt: repository.updatedAt,
  };

  return {
    repository: researchRepository,
    readme: repository.readme ?? null,
  };
}

function createContentSource(
  repository: RepositoryData,
  research: ResearchResultData,
): ContentSource {
  return {
    repository: {
      fullName: repository.fullName,
      url: repository.url,
      description: repository.description,
      language: repository.language,
      topics: repository.topics,
    },
    research,
  };
}

export function RepositoryForm() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [error, setError] = useState("");
  const [researchError, setResearchError] = useState("");
  const [contentError, setContentError] = useState("");
  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [research, setResearch] = useState<ResearchResultData | null>(null);
  const [contentDrafts, setContentDrafts] = useState<ContentDraftResult | null>(null);
  const [contentFeedback, setContentFeedback] = useState<ContentFeedback | null>(null);
  const [status, setStatus] = useState<ResearchStatus>("idle");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const isLoading = status !== "idle";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = parseGitHubRepository(repositoryUrl);

    if (!input) {
      setRepository(null);
      setResearch(null);
      setContentDrafts(null);
      setContentFeedback(null);
      setContentError("");
      setError("请输入完整的 GitHub 仓库地址，例如 https://github.com/vercel/next.js");
      return;
    }

    setError("");
    setResearchError("");
    setContentError("");
    setRepository(null);
    setResearch(null);
    setContentDrafts(null);
    setContentFeedback(null);
    setStatus("loadingRepository");
    let isResearchStep = false;

    try {
      const searchParams = new URLSearchParams({
        owner: input.owner,
        repo: input.name,
        include: "readme",
      });
      const response = await fetch(`/api/repositories?${searchParams}`);
      const payload: ApiResponse<RepositoryData> = await response.json();

      if ("error" in payload) {
        setError(payload.error.message);
        return;
      }

      setRepository(payload.data);

      setStatus("generatingResearch");
      isResearchStep = true;

      const researchResponse = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: createResearchSource(payload.data) }),
      });
      const researchPayload: ApiResponse<ResearchResultData> = await researchResponse.json();

      if ("error" in researchPayload) {
        setResearchError(researchPayload.error.message);
        return;
      }

      setResearch(researchPayload.data);
    } catch {
      if (isResearchStep) {
        setResearchError("暂时无法生成研究结论，请稍后再试。");
      } else {
        setError("暂时无法连接服务，请稍后再试。");
      }
    } finally {
      setStatus("idle");
    }
  }

  async function handleGenerateContent() {
    if (!repository || !research || isGeneratingContent) {
      return;
    }

    setContentError("");
    setContentDrafts(null);
    setContentFeedback(null);
    setIsGeneratingContent(true);

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: createContentSource(repository, research) }),
      });
      const payload: ApiResponse<ContentDraftResult> = await response.json();

      if ("error" in payload) {
        setContentError(payload.error.message);
        return;
      }

      setContentDrafts(payload.data);
    } catch {
      setContentError("暂时无法生成内容草稿，请稍后再试。");
    } finally {
      setIsGeneratingContent(false);
    }
  }

  async function handleContentFeedback(feedback: ContentFeedback) {
    if (!repository) {
      return;
    }

    setContentFeedback(feedback);

    try {
      await fetch("/api/content/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryFullName: repository.fullName, feedback }),
      });
    } catch {
      // 反馈采集失败不影响草稿阅读与编辑。
    }
  }

  return (
    <div className="space-y-5">
      <form
        className="rounded-2xl bg-white p-6 text-zinc-950 shadow-2xl shadow-black/20"
        onSubmit={handleSubmit}
        aria-busy={isLoading}
      >
        <label className="text-sm font-semibold" htmlFor="repository-url">
          GitHub 仓库地址
        </label>
        <p className="mt-1 text-sm text-zinc-500">读取公开仓库信息，作为后续研究的可信资料。</p>

        <input
          id="repository-url"
          className="mt-5 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm transition outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
          type="url"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          placeholder="https://github.com/vercel/next.js"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "repository-error" : undefined}
          disabled={isLoading}
        />

        {error ? (
          <p className="mt-3 text-sm text-red-600" id="repository-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          type="submit"
          disabled={!repositoryUrl.trim() || isLoading}
        >
          {status === "loadingRepository"
            ? "正在读取仓库…"
            : status === "generatingResearch"
              ? "正在分析项目…"
              : "开始研究"}
        </button>
      </form>

      {repository ? (
        <section
          className="rounded-2xl border border-lime-300/30 bg-lime-300/10 p-5"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-lime-300">已读取仓库</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{repository.fullName}</h2>
            </div>
            {repository.language ? (
              <span className="rounded-full border border-lime-300/30 px-2.5 py-1 text-xs text-lime-200">
                {repository.language}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {repository.description || "该仓库暂未提供描述。"}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-sm">
            <div>
              <dt className="text-zinc-500">Stars</dt>
              <dd className="mt-1 font-semibold text-white">{formatNumber(repository.stars)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Forks</dt>
              <dd className="mt-1 font-semibold text-white">{formatNumber(repository.forks)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Issues</dt>
              <dd className="mt-1 font-semibold text-white">
                {formatNumber(repository.openIssues)}
              </dd>
            </div>
          </dl>

          {repository.topics.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="仓库主题">
              {repository.topics.slice(0, 5).map((topic) => (
                <li
                  key={topic}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
                >
                  {topic}
                </li>
              ))}
            </ul>
          ) : null}

          <a
            className="mt-5 inline-flex text-sm font-medium text-lime-300 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
            href={repository.url}
            target="_blank"
            rel="noreferrer"
          >
            在 GitHub 查看仓库 <span aria-hidden="true">↗</span>
          </a>
        </section>
      ) : null}

      {researchError ? (
        <p
          className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
          role="alert"
        >
          {researchError}
        </p>
      ) : null}

      {research ? <ResearchResult research={research} /> : null}

      {research ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-lime-300">下一步</p>
              <h2 className="mt-1 text-xl font-semibold text-white">生成多平台内容草稿</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                仅使用已展示的研究结论生成微信公众号和小红书初稿。
              </p>
            </div>
            <button
              className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={isGeneratingContent}
              onClick={handleGenerateContent}
            >
              {isGeneratingContent
                ? "正在生成草稿…"
                : contentDrafts
                  ? "重新生成草稿"
                  : "生成内容草稿"}
            </button>
          </div>

          {contentError ? (
            <p
              className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
              role="alert"
            >
              {contentError}
            </p>
          ) : null}
        </section>
      ) : null}

      {contentDrafts ? (
        <ContentDrafts
          drafts={contentDrafts}
          feedback={contentFeedback}
          onFeedback={handleContentFeedback}
        />
      ) : null}
    </div>
  );
}
