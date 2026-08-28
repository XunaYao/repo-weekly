"use client";

import { FormEvent, useState } from "react";

type Repository = {
  owner: string;
  name: string;
};

function parseGitHubRepository(value: string): Repository | null {
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

export function RepositoryForm() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [error, setError] = useState("");
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const repository = parseGitHubRepository(repositoryUrl);

    if (!repository) {
      setSelectedRepository(null);
      setError("请输入完整的 GitHub 仓库地址，例如 https://github.com/vercel/next.js");
      return;
    }

    setError("");
    setSelectedRepository(repository);
  }

  return (
    <form
      className="rounded-2xl bg-white p-6 text-zinc-950 shadow-2xl shadow-black/20"
      onSubmit={handleSubmit}
    >
      <label className="text-sm font-semibold" htmlFor="repository-url">
        GitHub 仓库地址
      </label>
      <p className="mt-1 text-sm text-zinc-500">下一课会使用这个地址读取真实仓库信息。</p>

      <input
        id="repository-url"
        className="mt-5 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm transition outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
        type="url"
        value={repositoryUrl}
        onChange={(event) => setRepositoryUrl(event.target.value)}
        placeholder="https://github.com/vercel/next.js"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "repository-error" : undefined}
      />

      {error ? (
        <p className="mt-3 text-sm text-red-600" id="repository-error" role="alert">
          {error}
        </p>
      ) : null}

      {selectedRepository ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          已识别：{selectedRepository.owner}/{selectedRepository.name}
        </p>
      ) : null}

      <button
        className="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        type="submit"
        disabled={!repositoryUrl.trim()}
      >
        开始研究
      </button>
    </form>
  );
}
