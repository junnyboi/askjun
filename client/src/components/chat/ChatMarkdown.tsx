/**
 * ChatMarkdown — renders an answer's markdown.
 * Answers come from a model, so raw HTML is not rendered (it shows as plain text),
 * web links open in a new tab, and only web and email links are clickable.
 */
import type { ComponentProps } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";

interface ChatMarkdownProps {
  content: string;
}

// Streamdown's defaults minus its raw-HTML plugin
const REHYPE_PLUGINS = [defaultRehypePlugins.harden, defaultRehypePlugins.katex];

const MARKDOWN_COMPONENTS = {
  a: ({ href = "", children }: ComponentProps<"a">) => {
    if (/^https?:\/\//i.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    if (/^mailto:/i.test(href)) return <a href={href}>{children}</a>;
    return <>{children}</>;
  },
};

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <Streamdown rehypePlugins={REHYPE_PLUGINS} components={MARKDOWN_COMPONENTS}>
      {content}
    </Streamdown>
  );
}
