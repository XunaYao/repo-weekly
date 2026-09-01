
export type CleanReadmeResult = {
  content: string;
  truncated: boolean;
};

const MAX_README_LENGTH = 30_000;

export function cleanReadme(markdown: string): CleanReadmeResult {
  if (!markdown) {
    return { content: "", truncated: false };
  }

  let cleaned = markdown
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length > MAX_README_LENGTH) {
    cleaned = cleaned.slice(0, MAX_README_LENGTH);

    return { content: cleaned, truncated: true };
  }

  return { content: cleaned, truncated: false };
}
