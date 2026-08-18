import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch | Seamlis",
  description: "Watch videos on Seamlis",
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
