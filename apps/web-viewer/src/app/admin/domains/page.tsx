import type { Metadata } from "next";
import DomainsClient from "./DomainsClient";

export const metadata: Metadata = {
  title: "Domains | Agency OS",
};

export default function DomainsPage() {
  return (
    <div className="p-6 lg:p-8">
      <DomainsClient />
    </div>
  );
}
