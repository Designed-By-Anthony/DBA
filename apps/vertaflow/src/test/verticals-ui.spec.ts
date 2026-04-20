import { describe, expect, it } from "vitest";

const verticalsForTest = {
  service: {
    sidebar: ["Dashboard", "Leads", "Jobs", "Work Orders"],
    pipeline: ["New Lead", "Estimate Sent", "In Progress", "Complete"],
  },
  retail: {
    sidebar: ["Dashboard", "Customers", "POS", "Inventory"],
    pipeline: ["New Order", "Processing", "Shipped", "Delivered"],
  },
  restaurant: {
    sidebar: ["Dashboard", "Orders", "Menu", "KDS"],
    pipeline: ["New Order", "Confirmed", "In Prep", "Ready"],
  },
} as const;

function renderVerticalPreview(
  id: keyof typeof verticalsForTest,
): { sidebarHtml: string; pipelineHtml: string } {
  const model = verticalsForTest[id];
  const sidebarHtml = model.sidebar.map((item) => `<li>${item}</li>`).join("");
  const pipelineHtml = model.pipeline.map((stage) => `<span>${stage}</span>`).join("");
  return { sidebarHtml, pipelineHtml };
}

describe("vertical preview integrity", () => {
  it("renders service vertical labels", () => {
    const output = renderVerticalPreview("service");
    expect(output.sidebarHtml).toContain("Work Orders");
    expect(output.pipelineHtml).toContain("Estimate Sent");
  });

  it("renders retail vertical labels", () => {
    const output = renderVerticalPreview("retail");
    expect(output.sidebarHtml).toContain("Inventory");
    expect(output.pipelineHtml).toContain("Processing");
  });

  it("renders restaurant vertical labels", () => {
    const output = renderVerticalPreview("restaurant");
    expect(output.sidebarHtml).toContain("KDS");
    expect(output.pipelineHtml).toContain("In Prep");
  });
});
