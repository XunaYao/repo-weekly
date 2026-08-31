// | 缺少 `owner` 或 `repo` | 400 | `INVALID_REPOSITORY` |
// | GitHub 返回 404        | 404 | `REPOSITORY_NOT_FOUND` |
// | GitHub 返回 403/429    | 429 | `GITHUB_RATE_LIMITED` |
// | GitHub 其他错误         | 502 | `GITHUB_API_ERROR` |
// | 请求异常                | 500 | `INTERNAL_ERROR` |

export async function GET(request: Request) {
  const url = new URL(request.url);

  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");

  // 参数校验
  if (!owner || !repo) {
    return Response.json(
      {
        error: { 
          code: "INVALID_REPOSITORY",
          message: "Missing 'owner' or 'repo' query parameter",
        },
      },
      { status: 400 },
    );
  }

  // 仅在服务端读取；不要使用 NEXT_PUBLIC_ 前缀。
  const githubToken = process.env.GITHUB_TOKEN;
  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const headers = new Headers({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "RepoWeekly",
    });

    if (githubToken) {
      headers.set("Authorization", `Bearer ${githubToken}`);
    }

    const response = await fetch(githubApiUrl, {
      headers,
      cache: "no-store",
    });
    // 转换响应数据
    if (response.status === 404) {
      return Response.json(
        {
          error: {
            code: "REPOSITORY_NOT_FOUND",
            message: "Repository not found",
          },
        },
        { status: 404 },
      );
    } else if (response.status === 403 || response.status === 429) {
      return Response.json(
        {
          error: {
            code: "GITHUB_RATE_LIMITED",
            message: "GitHub rate limit exceeded",
          },
        },
        { status: 429 },
      );
    } else if (!response.ok) {
      return Response.json(
        {
          error: {
            code: "GITHUB_API_ERROR",
            message: "Error occurred while fetching GitHub API",
          },
        },
        { status: 502 },
      );
    }

    const githubData = await response.json();

    const data = {
      owner: githubData.owner.login,
      name: githubData.name,
      fullName: githubData.full_name,
      description: githubData.description,
      url: githubData.html_url,
      stars: githubData.stargazers_count,
      forks: githubData.forks_count,
      openIssues: githubData.open_issues_count,
      language: githubData.language,
      topics: githubData.topics,
      defaultBranch: githubData.default_branch,
      updatedAt: githubData.updated_at,
    };

    return Response.json({ data });
  } catch (error) {
    console.error("Error fetching GitHub API:", error);
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
