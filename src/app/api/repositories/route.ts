

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
  if(!owner || !repo) {
    return Response.json({ error: "INVALID_REPOSITORY" }, { status: 400 });
  }

  // 请求 GitHub API
  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const response = await fetch(githubApiUrl);
  // 转换响应数据
  if(response.status === 404) {
    return Response.json({ error: "REPOSITORY_NOT_FOUND" }, { status: 404 });
  } else if(response.status === 403 || response.status === 429) {
    return Response.json({ error: "GITHUB_RATE_LIMITED" }, { status: 429 });
  } else if(!response.ok) {
    return Response.json({ error: "GITHUB_API_ERROR" }, { status: 502 });
  }

  const githubData = await response.json();

  const repository = {
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

  return Response.json(repository);

}