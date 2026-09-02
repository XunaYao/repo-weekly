import { cleanReadme, type CleanReadmeResult } from "@/lib/readme";

type RepositoryRequest = {
  owner: string;
  repo: string;
  includeReadme: boolean;
};

type GitHubRepository = {
  owner: { login: string };
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  default_branch: string;
  updated_at: string;
};

type ReadmeResult =
  | { readme: CleanReadmeResult | null }
  | { errorResponse: Response };

function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

function getRepositoryRequest(request: Request): RepositoryRequest | null {
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");

  if (!owner || !repo) {
    return null;
  }

  return {
    owner,
    repo,
    includeReadme: url.searchParams.get("include") === "readme",
  };
}

function createGitHubHeaders() {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "RepoWeekly",
  });

  const githubToken = process.env.GITHUB_TOKEN;

  if (githubToken) {
    headers.set("Authorization", `Bearer ${githubToken}`);
  }

  return headers;
}

function getGitHubRepositoryUrl(owner: string, repo: string) {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

function getGitHubFailureResponse(response: Response, resource: "repository" | "README") {
  if (response.status === 403 || response.status === 429) {
    return jsonError("GITHUB_RATE_LIMITED", "GitHub rate limit exceeded", 429);
  }

  return jsonError(
    "GITHUB_API_ERROR",
    `Error occurred while fetching ${resource === "README" ? "repository README" : "GitHub API"}`,
    502,
  );
}

function toRepositoryData(repository: GitHubRepository, readme?: CleanReadmeResult | null) {
  return {
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    url: repository.html_url,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    language: repository.language,
    topics: repository.topics,
    defaultBranch: repository.default_branch,
    updatedAt: repository.updated_at,
    ...(readme !== undefined ? { readme } : {}),
  };
}

async function getReadme(
  owner: string,
  repo: string,
  headers: Headers,
): Promise<ReadmeResult> {
  const readmeHeaders = new Headers(headers);
  readmeHeaders.set("Accept", "application/vnd.github.raw+json");

  const response = await fetch(`${getGitHubRepositoryUrl(owner, repo)}/readme`, {
    headers: readmeHeaders,
    cache: "no-store",
  });

  if (response.status === 404) {
    return { readme: null };
  }

  if (!response.ok) {
    return { errorResponse: getGitHubFailureResponse(response, "README") };
  }

  return { readme: cleanReadme(await response.text()) };
}

export async function GET(request: Request) {
  const repositoryRequest = getRepositoryRequest(request);

  if (!repositoryRequest) {
    return jsonError(
      "INVALID_REPOSITORY",
      "Missing 'owner' or 'repo' query parameter",
      400,
    );
  }

  const { owner, repo, includeReadme } = repositoryRequest;

  try {
    const headers = createGitHubHeaders();
    const response = await fetch(getGitHubRepositoryUrl(owner, repo), {
      headers,
      cache: "no-store",
    });

    if (response.status === 404) {
      return jsonError("REPOSITORY_NOT_FOUND", "Repository not found", 404);
    }

    if (!response.ok) {
      return getGitHubFailureResponse(response, "repository");
    }

    const repository = (await response.json()) as GitHubRepository;

    if (!includeReadme) {
      return Response.json({ data: toRepositoryData(repository) });
    }

    const readmeResult = await getReadme(owner, repo, headers);

    if ("errorResponse" in readmeResult) {
      return readmeResult.errorResponse;
    }

    return Response.json({ data: toRepositoryData(repository, readmeResult.readme) });
  } catch (error) {
    console.error("Error fetching GitHub API:", error);

    return jsonError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
