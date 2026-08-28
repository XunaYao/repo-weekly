export type RepositorySummary = {
  owner: string;
  name: string;
  description: string;
  language: string;
  topic: string;
};

type RepositoryCardProps = {
  repository: RepositorySummary;
};

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const repositoryName = `${repository.owner}/${repository.name}`;

  return (
    <article className="flex min-h-64 flex-col rounded-2xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="rounded-full bg-lime-300/10 px-3 py-1 font-medium text-lime-300">
          {repository.topic}
        </span>
        <span className="text-zinc-500">{repository.language}</span>
      </div>

      <h3 className="mt-8 text-xl font-semibold tracking-tight break-words">{repositoryName}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{repository.description}</p>

      <a
        className="mt-auto pt-8 text-sm font-medium text-zinc-200 transition-colors hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300"
        href={`https://github.com/${repositoryName}`}
        target="_blank"
        rel="noreferrer"
      >
        查看仓库 <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
