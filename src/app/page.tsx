import { RepositoryCard, type RepositorySummary } from "@/components/repository-card";
import { RepositoryForm } from "@/components/repository-form";

const featuredRepositories: RepositorySummary[] = [
  {
    owner: "open-webui",
    name: "open-webui",
    description: "一个可自托管的 AI 交互界面，适合研究成熟开源产品的前端架构。",
    language: "TypeScript",
    topic: "AI 应用",
  },
  {
    owner: "biomejs",
    name: "biome",
    description: "面向 Web 项目的高性能工具链，统一处理格式化和代码检查。",
    language: "Rust",
    topic: "开发工具",
  },
  {
    owner: "astral-sh",
    name: "uv",
    description: "快速的 Python 包与项目管理工具，也是研究 Rust 工程实践的好样本。",
    language: "Rust",
    topic: "效率工具",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-lg font-semibold tracking-tight">RepoWeekly</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
        <div>
          <p className="mb-5 text-sm font-medium text-lime-300">开源项目研究与内容创作</p>
          <h1 className="max-w-3xl text-5xl leading-[1.05] font-semibold tracking-[-0.05em] sm:text-6xl">
            每周发现一个值得关注的开源项目
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            输入 GitHub 仓库地址，生成可信的项目解读和多渠道内容。
          </p>
        </div>

        <RepositoryForm />
      </section>

      <section className="border-t border-white/10 bg-zinc-900/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-lime-300">本周候选</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">值得研究的项目</h2>
            </div>
            <p className="text-sm text-zinc-500">课程 2 暂时使用静态数据</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredRepositories.map((repository) => (
              <RepositoryCard
                key={`${repository.owner}/${repository.name}`}
                repository={repository}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
