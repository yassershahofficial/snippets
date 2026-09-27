import type { Metadata } from "next";
import "./cms.css";

export const metadata: Metadata = {
  title: { default: "CMS · Snippets", template: "%s · Snippets CMS" },
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <div className="cms">{children}</div>;
}
