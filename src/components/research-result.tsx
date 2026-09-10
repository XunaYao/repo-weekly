import type { ResearchResult } from "@/lib/research";

type ResearchResultProps = {
  research: ResearchResult;
};

type ResearchListProps = {
  title: string;
  items: string[];
  tone?: "default" | "accent" | "warning";
};

function ResearchList({ title, items, tone = "default" }: ResearchListProps) {
  if (items.length === 0) {
    return null;
  }

  const toneClasses = {
    default: "border-white/10 bg-white/5",
    accent: "border-lime-300/20 bg-lime-300/5",
    warning: "border-amber-300/20 bg-amber-300/5",
  };

  return (
    <section className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
        {items.map((item, index) => (
          <li className="flex gap-2" key={`${item}-${index}`}>
            <span className="text-lime-300" aria-hidden="true">
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResearchResult({ research }: ResearchResultProps) {
  const scopeLabels = {
    "language-agnostic": "不限项目语言",
    "language-specific": "限定项目语言",
    unknown: "语言兼容性待确认",
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5" aria-live="polite">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-lime-300">AI 项目研究</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
            {research.projectType}
          </span>
        </div>
        <h2 className="mt-1 text-xl font-semibold text-white">值得关注的原因</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{research.summary}</p>
      </div>

      <div className="mt-5 grid gap-3">
        <section className="rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">项目兼容性</h3>
            <span className="rounded-full bg-sky-300/10 px-2 py-0.5 text-xs text-sky-200">
              {scopeLabels[research.compatibility.scope]}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ResearchList
              title="支持的项目语言"
              items={research.compatibility.supportedLanguages}
            />
            <ResearchList title="支持的工具与环境" items={research.compatibility.supportedTools} />
            <ResearchList title="使用要求" items={research.compatibility.requirements} />
            <ResearchList title="兼容性说明" items={research.compatibility.notes} />
          </div>
        </section>
        <ResearchList title="适合谁使用" items={research.targetUsers} />
        <ResearchList title="核心能力" items={research.coreCapabilities} />
        <ResearchList title="技术亮点" items={research.technicalHighlights} />
        <ResearchList title="内容选题" items={research.contentAngles} tone="accent" />
        <ResearchList title="风险与待确认事项" items={research.risks} tone="warning" />
      </div>

      {research.evidence.length > 0 ? (
        <section className="mt-5 border-t border-white/10 pt-4">
          <h3 className="text-sm font-semibold text-white">依据</h3>
          <ul className="mt-3 space-y-3">
            {research.evidence.map((evidence, index) => (
              <li className="text-sm leading-6 text-zinc-400" key={`${evidence.claim}-${index}`}>
                <p>{evidence.claim}</p>
                <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                  {evidence.source === "repository" ? "仓库元数据" : "README"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
