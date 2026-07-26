import type { ReportItem } from "@/services/api/reports";
import { CATEGORY_LABELS, isOpenCase } from "./constants";
import type { CaseFilter } from "./CaseFilters";

export function filterReports(
  reports: ReportItem[],
  query: string,
  caseFilter: CaseFilter
): ReportItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return reports.filter((report) => {
    if (caseFilter === "open" && !isOpenCase(report.status)) return false;
    if (caseFilter === "resolved" && report.status !== "resolved") return false;

    if (!normalizedQuery) return true;

    const category = (CATEGORY_LABELS[report.type] || report.type).toLowerCase();
    const haystack = [
      report.reportNumber,
      report.type,
      category,
      report.description,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
