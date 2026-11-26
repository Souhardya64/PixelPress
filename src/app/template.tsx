import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="pp-page-in">{children}</div>;
}
