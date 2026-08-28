import { describe, expect, it } from "vitest";
import { calculatePortfolioMetrics, portfolioHealthLabel } from "./portfolioIntelligence";

describe("calculatePortfolioMetrics", () => {
  describe("equity exposure calculation from actual allocation", () => {
    it("calculates 100% equity for all-equity allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 60 },
        { name: "NASDAQ", value: 40 },
      ]);

      expect(result.equityExposure).toBe(100);
      expect(result.fixedIncomeExposure).toBe(0);
    });

    it("calculates 0% equity for all-bond allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "Bonds (ETF)", value: 70 },
        { name: "Cash", value: 30 },
      ]);

      expect(result.equityExposure).toBe(0);
      expect(result.fixedIncomeExposure).toBe(100);
    });

    it("calculates partial equity from mixed allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 50 },
        { name: "Bonds (ETF)", value: 30 },
        { name: "Cash", value: 20 },
      ]);

      expect(result.equityExposure).toBe(50);
      expect(result.fixedIncomeExposure).toBe(50);
    });

    it("clamps equity exposure to 100 max", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 70 },
        { name: "International Stocks (ETF)", value: 50 },
      ]);

      expect(result.equityExposure).toBeLessThanOrEqual(100);
    });

    it("handles Hebrew equity asset names", () => {
      const result = calculatePortfolioMetrics([
        { name: "מניות US", value: 50 },
        { name: "אג״ח", value: 50 },
      ]);

      expect(result.equityExposure).toBe(50);
    });
  });

  describe("diversification score calculation", () => {
    it("returns 0 for empty allocation", () => {
      const result = calculatePortfolioMetrics([]);

      expect(result.diversification).toBe("low");
    });

    it("returns high diversification for well-spread allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 20 },
        { name: "Intl Stocks", value: 20 },
        { name: "Bonds", value: 20 },
        { name: "Cash", value: 20 },
        { name: "Real Estate", value: 20 },
      ]);

      expect(result.diversification).toBe("high");
    });

    it("returns low diversification for concentrated allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 90 },
        { name: "Cash", value: 10 },
      ]);

      expect(result.diversification).toBe("low");
    });

    it("returns medium diversification for moderately spread allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 40 },
        { name: "Bonds", value: 35 },
        { name: "Cash", value: 25 },
      ]);

      expect(result.diversification).toBe("medium");
    });

    it("single asset gets lowest diversification score", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 100 },
      ]);

      expect(result.diversification).toBe("low");
    });
  });

  describe("risk level classification", () => {
    it("classifies high risk for >= 75% equity", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 80 },
        { name: "Bonds", value: 20 },
      ]);

      expect(result.riskLevel).toBe("high");
    });

    it("classifies low risk for <= 35% equity", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 20 },
        { name: "Bonds", value: 80 },
      ]);

      expect(result.riskLevel).toBe("low");
    });

    it("classifies medium risk for 36-74% equity", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 50 },
        { name: "Bonds", value: 50 },
      ]);

      expect(result.riskLevel).toBe("medium");
    });

    it("exactly 75% equity is high risk", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 75 },
        { name: "Bonds", value: 25 },
      ]);

      expect(result.riskLevel).toBe("high");
    });

    it("exactly 35% equity is low risk", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 35 },
        { name: "Bonds", value: 65 },
      ]);

      expect(result.riskLevel).toBe("low");
    });

    it("exactly 36% equity is medium risk", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 36 },
        { name: "Bonds", value: 64 },
      ]);

      expect(result.riskLevel).toBe("medium");
    });
  });

  describe("allocation normalization", () => {
    it("filters out zero-value items", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 50 },
        { name: "Bonds", value: 0 },
        { name: "Cash", value: 50 },
      ]);

      expect(result.largestPosition).not.toBe("Bonds");
    });

  it("handles non-array input gracefully", () => {
    const result = calculatePortfolioMetrics([]);

    expect(result.expectedReturn).toBe(0);
    expect(result.equityExposure).toBe(0);
    expect(result.fixedIncomeExposure).toBe(100);
  });

    it("clamps individual values to 0-100 range", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 150 },
        { name: "Bonds", value: 50 },
      ]);

      expect(result.equityExposure).toBeLessThanOrEqual(100);
    });

    it("handles allocation with values over 100 total", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 60 },
        { name: "Bonds", value: 60 },
      ]);

      expect(result.equityExposure).toBeLessThanOrEqual(100);
      expect(result.fixedIncomeExposure).toBeLessThanOrEqual(100);
    });
  });

  describe("expected return estimation", () => {
    it("returns 0 for empty allocation", () => {
      const result = calculatePortfolioMetrics([]);

      expect(result.expectedReturn).toBe(0);
    });

    it("returns ~7% for 100% equity allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 100 },
      ]);

      expect(result.expectedReturn).toBeCloseTo(7, 0);
    });

    it("returns ~3% for 100% bonds allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "Bonds (ETF)", value: 100 },
      ]);

      expect(result.expectedReturn).toBeCloseTo(3, 0);
    });

    it("returns weighted average for mixed allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 50 },
        { name: "Bonds (ETF)", value: 50 },
      ]);

      expect(result.expectedReturn).toBeCloseTo(5, 0);
    });

    it("recognizes Hebrew equity names in return estimation", () => {
      const result = calculatePortfolioMetrics([
        { name: "מניות S&P 500", value: 100 },
      ]);

      expect(result.expectedReturn).toBeCloseTo(7, 0);
    });
  });

  describe("edge cases", () => {
    it("handles empty allocation", () => {
      const result = calculatePortfolioMetrics([]);

    expect(result.expectedReturn).toBe(0);
    expect(result.equityExposure).toBe(0);
    expect(result.fixedIncomeExposure).toBe(100);
    expect(result.riskLevel).toBe("low");
    expect(result.diversification).toBe("low");
    });

    it("handles single asset allocation", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 100 },
      ]);

      expect(result.diversification).toBe("low");
      expect(result.largestPositionWeight).toBe(100);
      expect(result.largestPosition).toBe("US Stocks (ETF)");
    });

    it("handles 100% equity", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks", value: 100 },
      ]);

      expect(result.equityExposure).toBe(100);
      expect(result.fixedIncomeExposure).toBe(0);
      expect(result.riskLevel).toBe("high");
    });

    it("handles 100% fixed income", () => {
      const result = calculatePortfolioMetrics([
        { name: "Bonds (ETF)", value: 100 },
      ]);

      expect(result.equityExposure).toBe(0);
      expect(result.fixedIncomeExposure).toBe(100);
      expect(result.riskLevel).toBe("low");
    });

    it("handles undefined name property", () => {
      const result = calculatePortfolioMetrics([
        { name: "", value: 50 },
        { name: "Bonds", value: 50 },
      ]);

      expect(result.equityExposure).toBe(0);
      expect(result.fixedIncomeExposure).toBe(100);
    });

    it("returns explanation mentioning equity and fixed income", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 60 },
        { name: "Bonds (ETF)", value: 40 },
      ]);

      expect(result.explanation).toContain("equity");
      expect(result.explanation).toContain("non-equity");
      expect(result.explanation).toContain("diversification");
    });

    it("warns about high concentration in single position >= 60%", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 70 },
        { name: "Bonds (ETF)", value: 30 },
      ]);

      expect(result.explanation).toContain("concentration");
    });

    it("does not warn about concentration when largest position < 60%", () => {
      const result = calculatePortfolioMetrics([
        { name: "US Stocks (ETF)", value: 40 },
        { name: "Bonds (ETF)", value: 35 },
        { name: "Cash", value: 25 },
      ]);

      expect(result.explanation).not.toContain("concentration");
    });
  });
});

describe("portfolioHealthLabel", () => {
  it("returns High concentration for largest position >= 70%", () => {
    const metrics = calculatePortfolioMetrics([
      { name: "US Stocks (ETF)", value: 80 },
      { name: "Bonds (ETF)", value: 20 },
    ]);

    expect(portfolioHealthLabel(metrics)).toBe("High concentration");
  });

  it("returns High equity exposure for equity >= 80%", () => {
    const metrics = calculatePortfolioMetrics([
      { name: "US Stocks", value: 40 },
      { name: "NASDAQ", value: 45 },
      { name: "Bonds", value: 15 },
    ]);

    expect(portfolioHealthLabel(metrics)).toBe("High equity exposure");
  });

  it("returns Balanced diversification for high diversification and non-high risk", () => {
    const metrics = calculatePortfolioMetrics([
      { name: "US Stocks", value: 20 },
      { name: "Intl Stocks", value: 20 },
      { name: "Bonds", value: 20 },
      { name: "Cash", value: 20 },
      { name: "Real Estate", value: 20 },
    ]);

    expect(portfolioHealthLabel(metrics)).toBe("Balanced diversification");
  });

  it("returns Medium diversification for medium diversification", () => {
    const metrics = calculatePortfolioMetrics([
      { name: "US Stocks", value: 40 },
      { name: "Bonds", value: 35 },
      { name: "Cash", value: 25 },
    ]);

    expect(portfolioHealthLabel(metrics)).toBe("Medium diversification");
  });

  it("returns Reasonable portfolio structure as fallback", () => {
    const metrics = calculatePortfolioMetrics([
      { name: "US Stocks", value: 68 },
      { name: "Bonds", value: 32 },
    ]);

    expect(portfolioHealthLabel(metrics)).toBe("Reasonable portfolio structure");
  });
});
