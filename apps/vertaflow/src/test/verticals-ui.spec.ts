import { describe, expect, it } from "vitest";
import {
  marketingVerticalLabels,
  marketingVerticals,
  marketingVerticalTabOrder,
} from "../marketing-verticals";

describe("marketing vertical models (production parity)", () => {
  it("covers every home-page tab with sidebar + pipeline content", () => {
    for (const id of marketingVerticalTabOrder) {
      const v = marketingVerticals[id];
      expect(v?.sidebar.length).toBeGreaterThan(4);
      expect(v?.pipeline.length).toBeGreaterThanOrEqual(4);
      expect(v?.kpis.length).toBeGreaterThanOrEqual(2);
      expect(marketingVerticalLabels[id]).toBeTruthy();
    }
  });

  it("service (contractor) exposes dispatch + estimate language", () => {
    const v = marketingVerticals.contractor;
    expect(v.sidebar.join(" ")).toMatch(/Work Orders/);
    expect(v.pipeline.map((s) => s.label).join("|")).toMatch(/Estimate Sent/);
  });

  it("restaurant (food) exposes KDS + prep language", () => {
    const v = marketingVerticals.food;
    expect(v.sidebar.join(" ")).toMatch(/KDS|Menu/);
    expect(v.pipeline.map((s) => s.label).join("|")).toMatch(/In Prep/);
  });

  it("retail exposes POS + inventory language", () => {
    const v = marketingVerticals.retail;
    expect(v.sidebar.join(" ")).toMatch(/POS/);
    expect(v.sidebar.join(" ")).toMatch(/Inventory/);
    expect(v.pipeline.map((s) => s.label).join("|")).toMatch(/Shipped/);
  });
});
