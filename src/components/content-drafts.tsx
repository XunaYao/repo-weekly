import type { ContentDraftResult } from "@/lib/content";

type ContentFeedback = "usable" | "needs-rewrite";

type ContentDraftsProps = {
  drafts: ContentDraftResult;
  feedback: ContentFeedback | null;
  onFeedback: (feedback: ContentFeedback) => void;
};

function DraftSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-zinc-300">{children}</div>
    </section>
  );
}

/** 展示经过服务端结构校验的微信公众号和小红书草稿。 */
export function ContentDrafts({ drafts, feedback, onFeedback }: ContentDraftsProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-lime-300">多平台内容草稿</p>
          <h2 className="mt-1 text-xl font-semibold text-white">可直接编辑的初稿</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">这份草稿有用吗？</span>
          <button
            className={`rounded-full px-3 py-1 transition ${
              feedback === "usable"
                ? "bg-lime-300 text-zinc-950"
                : "bg-white/10 text-zinc-200 hover:bg-white/20"
            }`}
            type="button"
            aria-pressed={feedback === "usable"}
            onClick={() => onFeedback("usable")}
          >
            可用
          </button>
          <button
            className={`rounded-full px-3 py-1 transition ${
              feedback === "needs-rewrite"
                ? "bg-amber-300 text-zinc-950"
                : "bg-white/10 text-zinc-200 hover:bg-white/20"
            }`}
            type="button"
            aria-pressed={feedback === "needs-rewrite"}
            onClick={() => onFeedback("needs-rewrite")}
          >
            需重写
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
          <p className="text-xs font-medium text-sky-200">微信公众号</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {drafts.wechat.title}
          </h3>
          <p className="mt-3 border-l-2 border-sky-200/60 pl-3 text-sm leading-6 text-zinc-300">
            {drafts.wechat.digest}
          </p>
          <div className="mt-5 text-sm leading-7 whitespace-pre-wrap text-zinc-200">
            {drafts.wechat.body}
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-sm font-medium text-sky-100">
            {drafts.wechat.callToAction}
          </p>
        </article>

        <article className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-4">
          <p className="text-xs font-medium text-rose-200">小红书</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {drafts.xiaohongshu.title}
          </h3>
          <div className="mt-5 text-sm leading-7 whitespace-pre-wrap text-zinc-200">
            {drafts.xiaohongshu.body}
          </div>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="小红书标签">
            {drafts.xiaohongshu.hashtags.map((hashtag) => (
              <li
                className="rounded-full bg-rose-300/10 px-2.5 py-1 text-xs text-rose-100"
                key={hashtag}
              >
                #{hashtag}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <DraftSection title="编辑提示">
        草稿基于仓库资料和研究结论生成。发布前请核对事实、补充个人体验，并按渠道规范调整。
      </DraftSection>
    </section>
  );
}
