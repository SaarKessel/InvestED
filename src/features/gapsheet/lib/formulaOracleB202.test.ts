// ---------------------------------------------------------------------------
// B202 - GapSheet formula engine exhaustion: Excel-semantics oracle tests.
// Every expected value is Excel's documented result for the same formula
// (date serials computed independently against the 1899-12-30 epoch).
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { evaluate, parseFormula, renameSheetInFormula, setClock, shiftFormulaRows, type CellValue } from "./workbook/formulas.js";

const run = (formula: string, cells: Record<string, CellValue> = {}): CellValue =>
  evaluate(parseFormula(formula), (a) => cells[a] ?? null);

const err = (formula: string, cells: Record<string, CellValue> = {}): string => {
  try { run(formula, cells); return "no error"; } catch (e) { return e instanceof Error ? e.message : String(e); }
};

afterEach(() => setClock(null));

describe("arithmetic precedence (Excel order)", () => {
  it.each([
    ["=2+3*4", 14], ["=(2+3)*4", 20], ["=10-4-3", 3], ["=2^3^2", 64], // Excel is left-associative for ^
    ["=-2^2", 4], ["=50%+1", 1.5], ["=2*-3", -6], ["=1/4", 0.25],
  ])("%s = %i", (f, v) => expect(run(f)).toBe(v));

  it("text concat and 15-digit number text", () => {
    expect(run('=1&2')).toBe("12");
    expect(run('="a"&1')).toBe("a1");
    expect(run("=0.1+0.2=0.3")).toBe(true); // 15 significant digit comparison
    expect(run("=0.1+0.2&\"\"")).toBe("0.3"); // and its text form never shows float noise
  });

  it("Excel ordering: numbers < text < logical", () => {
    expect(run("=1<\"a\"")).toBe(true);
    expect(run("=\"a\"<TRUE")).toBe(true);
    expect(run("=TRUE=1")).toBe(false); // logical vs number never equal
    expect(run("=\"Apple\"=\"apple\"")).toBe(true); // case-insensitive text
  });
});

describe("aggregate functions", () => {
  const cells = { A1: 10, A2: 20, A3: "text", A4: null, A5: 5, B1: true };
  it("SUM ignores text and blanks in ranges", () => expect(run("=SUM(A1:A5)", cells)).toBe(35));
  it("AVERAGE divides by numeric count only", () => expect(run("=AVERAGE(A1:A5)", cells)).toBeCloseTo(35 / 3, 12));
  it("MIN and MAX over numerics", () => {
    expect(run("=MIN(A1:A5)", cells)).toBe(5);
    expect(run("=MAX(A1:A5)", cells)).toBe(20);
  });
  it("COUNT counts numbers, COUNTA counts non-blanks", () => {
    expect(run("=COUNT(A1:A5)", cells)).toBe(3);
    expect(run("=COUNTA(A1:A5)", cells)).toBe(4);
  });
  it("AVERAGE of no numbers is #DIV/0!", () => expect(err("=AVERAGE(A3:A4)", cells)).toBe("#DIV/0!"));
  it("scalar arguments are coerced like Excel", () => {
    expect(run("=SUM(1,2,3)")).toBe(6);
    expect(run('=SUM("4",2)')).toBe(6);
  });
});

describe("logic functions", () => {
  it("IF branches and defaults to FALSE", () => {
    expect(run("=IF(1>2,10,20)")).toBe(20);
    expect(run("=IF(2>1,10)")).toBe(10);
    expect(run("=IF(0,10)")).toBe(false);
  });
  it("IFERROR catches evaluation errors only", () => {
    expect(run("=IFERROR(1/0,42)")).toBe(42);
    expect(run("=IFERROR(7,42)")).toBe(7);
  });
  it("AND OR NOT", () => {
    expect(run("=AND(1,TRUE,2>1)")).toBe(true);
    expect(run("=AND(1,0)")).toBe(false);
    expect(run("=OR(0,FALSE)")).toBe(false);
    expect(run("=NOT(0)")).toBe(true);
  });
});

describe("criteria functions against Excel semantics", () => {
  const cells = { A1: 15000, A2: 8000, A3: 22000, A4: 8000, B1: "Sarah", B2: "sarah", B3: "Dan", B4: "Sarah" };
  it("SUMIF with string and numeric criteria", () => {
    expect(run("=SUMIF(A1:A4,\">10000\")", cells)).toBe(37000);
    expect(run("=SUMIF(A1:A4,8000)", cells)).toBe(16000);
    expect(run("=SUMIF(A1:A4,\"<>8000\")", cells)).toBe(37000);
  });
  it("COUNTIF is case-insensitive for text", () => expect(run("=COUNTIF(B1:B4,\"sarah\")", cells)).toBe(3));
  it("SUMIFS and COUNTIFS require every pair to match", () => {
    expect(run("=SUMIFS(A1:A4,A1:A4,\">5000\",B1:B4,\"sarah\")", cells)).toBe(31000); // rows 1, 2 and 4 all match
    expect(run("=COUNTIFS(A1:A4,\">=8000\",B1:B4,\"Sarah\")", cells)).toBe(3);
  });
  it("AVERAGEIF", () => {
    expect(run("=AVERAGEIF(B1:B4,\"sarah\",A1:A4)", cells)).toBeCloseTo((15000 + 8000 + 8000) / 3, 12);
    expect(err("=AVERAGEIF(B1:B4,\"nobody\",A1:A4)", cells)).toBe("#DIV/0!");
  });
  it("SUMPRODUCT multiplies row by row, treating text as 0", () => {
    expect(run("=SUMPRODUCT(A1:A4,A1:A4)", cells)).toBe(15000 ** 2 + 8000 ** 2 + 22000 ** 2 + 8000 ** 2);
  });
});

describe("lookups", () => {
  const cells = { A1: "a", A2: "b", A3: "c", B1: 10, B2: 20, B3: 30, C1: 1, C2: 5, C3: 9, D1: "x", D2: "y", D3: "z" };
  it("VLOOKUP exact and approximate", () => {
    expect(run("=VLOOKUP(\"b\",A1:B3,2,FALSE)", cells)).toBe(20);
    expect(err("=VLOOKUP(\"q\",A1:B3,2,FALSE)", cells)).toBe("#N/A");
    expect(run("=VLOOKUP(6,C1:D3,2)", cells)).toBe("y"); // approximate: largest key <= 6 is 5
    expect(run("=VLOOKUP(5,C1:D3,2,TRUE)", cells)).toBe("y");
  });
  it("XLOOKUP exact with not-found fallback", () => {
    expect(run("=XLOOKUP(\"c\",A1:A3,B1:B3)", cells)).toBe(30);
    expect(run("=XLOOKUP(\"q\",A1:A3,B1:B3,\"missing\")", cells)).toBe("missing");
    expect(err("=XLOOKUP(\"q\",A1:A3,B1:B3)", cells)).toBe("#N/A");
  });
  it("INDEX and MATCH compose", () => {
    expect(run("=INDEX(B1:B3,2)", cells)).toBe(20);
    expect(run("=MATCH(\"b\",A1:A3,0)", cells)).toBe(2);
    expect(run("=INDEX(B1:B3,MATCH(\"c\",A1:A3,0))", cells)).toBe(30);
    expect(err("=INDEX(B1:B3,9)", cells)).toBe("#REF!");
  });
});

describe("rounding and math", () => {
  it.each([
    ["=ROUND(2.5,0)", 3], ["=ROUND(-2.5,0)", -3], ["=ROUND(0.285,2)", 0.29],
    ["=ROUNDUP(2.31,1)", 2.4], ["=ROUNDDOWN(2.39,1)", 2.3], ["=ROUNDUP(-2.31,1)", -2.4],
    ["=MOD(7,3)", 1], ["=MOD(-3,2)", 1], ["=MOD(3,-2)", -1], // Excel: sign of the divisor
    ["=SQRT(2)", Math.SQRT2], ["=POWER(2,10)", 1024], ["=ABS(-4)", 4],
  ])("%s = %i", (f, v) => expect(run(f) as number).toBeCloseTo(v as number, 12));
  it("error cases", () => {
    expect(err("=MOD(1,0)")).toBe("#DIV/0!");
    expect(err("=SQRT(-1)")).toBe("#NUM!");
    expect(err("=POWER(0,-1)")).toBe("#DIV/0!");
    expect(err("=1/0")).toBe("#DIV/0!");
    expect(err("=0^0")).toBe("#NUM!");
  });
});

describe("dates (serials independently computed from the 1899-12-30 epoch)", () => {
  it("DATE/YEAR/MONTH/DAY round-trip", () => {
    expect(run("=DATE(2024,2,29)")).toBe(45351);
    expect(run("=DATE(2024,13,1)")).toBe(45658); // month overflow rolls into 2025-01-01
    expect(run("=YEAR(DATE(2024,2,29))")).toBe(2024);
    expect(run("=MONTH(DATE(2024,2,29))")).toBe(2);
    expect(run("=DAY(DATE(2024,2,29))")).toBe(29);
  });
  it("EOMONTH lands on the last day, EDATE clamps the day", () => {
    expect(run("=EOMONTH(DATE(2024,1,15),0)")).toBe(45322); // 2024-01-31
    expect(run("=EOMONTH(DATE(2024,1,15),1)")).toBe(45351); // 2024-02-29 (leap)
    expect(run("=EDATE(DATE(2024,1,31),1)")).toBe(45351); // clamps to Feb 29
    expect(run("=EDATE(DATE(2024,2,29),12)")).toBe(45716); // +12 months clamps to 2025-02-28
  });
  it("DATEDIF units", () => {
    expect(run("=DATEDIF(DATE(2024,1,1),DATE(2025,1,1),\"D\")")).toBe(366);
    expect(run("=DATEDIF(DATE(2024,1,31),DATE(2024,2,28),\"M\")")).toBe(0); // day 28 < 31
    expect(run("=DATEDIF(DATE(2024,1,31),DATE(2024,3,1),\"M\")")).toBe(1);
    expect(run("=DATEDIF(DATE(2020,6,15),DATE(2024,6,14),\"Y\")")).toBe(3);
    expect(err("=DATEDIF(DATE(2025,1,1),DATE(2024,1,1),\"D\")")).toBe("#NUM!");
  });
  it("TODAY and NOW use the injected clock (local calendar fields, like Excel)", () => {
    setClock(() => new Date(2026, 4, 17, 10, 30, 0)); // local time constructor: timezone-independent
    expect(run("=TODAY()")).toBe(Date.UTC(2026, 4, 17) / 86400000 + 25569);
    expect(run("=NOW()")).toBeCloseTo(Date.UTC(2026, 4, 17) / 86400000 + 25569 + (10.5 * 3600) / 86400, 9);
  });
});

describe("text functions", () => {
  it.each([
    ['=LEFT("hello",2)', "he"], ['=RIGHT("hello")', "o"], ['=MID("hello",2,3)', "ell"],
    ['=LEN("abc")', 3], ['=TRIM("  a   b  ")', "a b"], ['=UPPER("aBc")', "ABC"], ['=LOWER("AbC")', "abc"],
    ['=CONCAT("a",1,"b")', "a1b"], ['=TEXTJOIN("-",TRUE,"a","","b")', "a-b"], ['=TEXTJOIN("-",FALSE,"a","","b")', "a--b"],
  ])("%s = %j", (f, v) => expect(run(f)).toBe(v));
  it("TEXT formats the documented subset", () => {
    expect(run('=TEXT(1234.5,"#,##0.0")')).toBe("1,234.5");
    expect(run('=TEXT(0.256,"0.0%")')).toBe("25.6%");
    expect(run('=TEXT(45351,"yyyy-mm-dd")')).toBe("2024-02-29");
    expect(run('=TEXT(45351,"dd/mm/yyyy")')).toBe("29/02/2024");
    expect(err('=TEXT(5,"$0.00")')).toBe("#VALUE!"); // outside the documented subset: explicit error
  });
});

describe("formula rewriting", () => {
  it("shiftFormulaRows moves relative rows only", () => {
    expect(shiftFormulaRows("=A1+$B$2+SUM(C1:C3)", 1)).toBe("=A2+$B$2+SUM(C2:C4)");
    expect(shiftFormulaRows("=A1", -1)).toBe("=#REF!"); // Excel: a reference shifted above row 1 breaks
    expect(shiftFormulaRows("=A2+$B$2", -1)).toBe("=A1+$B$2");
    expect(err("=A0+1")).not.toBe("no error"); // A0 is never a valid address
    expect(err("=#REF!+1")).toBe("#REF!"); // and the broken reference evaluates to the error, never a number
  });
  it("renameSheetInFormula leaves string literals alone and is case-insensitive", () => {
    expect(renameSheetInFormula("=Sales!A1+'My Data'!B2+\"Sales!A1\"", "sales", "Q1")).toBe("=Q1!A1+'My Data'!B2+\"Sales!A1\"");
    expect(renameSheetInFormula("='My Data'!A1", "My Data", "Q 1")).toBe("='Q 1'!A1");
  });
});

describe("parser rejects malformed input explicitly", () => {
  it.each([
    ["1+1", "Formula must start with ="],
    ["=SUM(A1", "Missing )"],
    ["=1+", "Unexpected end of formula"],
    ["=NOSUCHFN(1)", "Unsupported function NOSUCHFN"],
    ["=A1:A5", "A range can only be used inside a function"],
    ["=1 2", "Unexpected trailing input"],
  ])("%s -> %s", (f, message) => expect(err(f)).toBe(message));
});
