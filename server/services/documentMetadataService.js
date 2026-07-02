/******************************************************************************
 * File: documentMetadataService.js
 * Layer: Domain Service
 * Responsibility:
 * Extracts structured document metadata from indexed knowledge text.
 ******************************************************************************/

/******************************************************************************
 * Helpers
 ******************************************************************************/

function normalizeText(text = "") {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getLineValue(text, label) {
  const regex = new RegExp(`^\\s*${label}\\s*:?\\s*(.+)$`, "im");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function getSectionText(text, heading, stopHeadings = []) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const stopPattern =
    stopHeadings.length > 0
      ? stopHeadings
          .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")
      : "$^";

  const regex = new RegExp(
    `${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n(?:${stopPattern})\\s*\\n|$)`,
    "i"
  );

  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractBulletItems(sectionText = "") {
  return sectionText
    .split("\n")
    .map((line) =>
      line
        .replace(/^[-•●*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function titleToFallbackCategory(title = "") {
  const lower = title.toLowerCase();

  if (lower.includes("tax") || lower.includes("client") || lower.includes("intake")) {
    return "Tax Operations";
  }

  if (lower.includes("expense") || lower.includes("travel") || lower.includes("reimbursement")) {
    return "Finance";
  }

  if (lower.includes("vacation") || lower.includes("leave") || lower.includes("remote")) {
    return "HR";
  }

  if (lower.includes("meeting")) {
    return "Administration";
  }

  if (lower.includes("it") || lower.includes("support") || lower.includes("password")) {
    return "IT";
  }

  if (
    lower.includes("bathroom") ||
    lower.includes("driveway") ||
    lower.includes("flooring") ||
    lower.includes("fence") ||
    lower.includes("contractor")
  ) {
    return "Operations / Facilities";
  }

  if (lower.includes("knowledge")) {
    return "Knowledge Management";
  }

  return "General";
}

function titleToFallbackOwner(title = "") {
  const category = titleToFallbackCategory(title);

  const owners = {
    "Tax Operations": "Tax Operations Lead",
    Finance: "Finance Director",
    HR: "HR Director",
    Administration: "Operations Manager",
    IT: "IT Support Lead",
    "Operations / Facilities": "Facilities Manager",
    "Knowledge Management": "Knowledge Owner",
    General: "Document Owner"
  };

  return owners[category] || "Document Owner";
}

function extractPurpose(text) {
  return getSectionText(text, "Purpose", [
    "Required Information",
    "Required Documents",
    "Project Scope",
    "Eligible Expenses",
    "Non-Reimbursable Expenses",
    "Submission Requirements",
    "Retention Period",
    "Payment Schedule",
    "Paid Time Off",
    "Review Objectives",
    "Meeting Requirements",
    "Fence Requirements",
    "Assessment",
    "Preparation",
    "Approved Sources",
    "Onboarding Steps",
    "Evaluation Criteria"
  ]);
}

function extractRelatedPolicies(text) {
  const relatedSection =
    getSectionText(text, "Related Policies", [
      "Frequently Asked Questions",
      "Audit and Compliance",
      "Guidelines",
      "Version Control"
    ]) || getSectionText(text, "Related Documents", ["Guidelines"]);

  if (!relatedSection) {
    return [];
  }

  return extractBulletItems(relatedSection);
}

function extractSectionHeadings(text) {
  const knownHeadings = [
    "Purpose",
    "Required Information",
    "Required Documents",
    "Project Scope",
    "Eligible Expenses",
    "Non-Reimbursable Expenses",
    "Receipt Requirements",
    "Submission Timeline",
    "Approval Workflow",
    "Mileage Reimbursement",
    "Corporate Credit Cards",
    "International Travel",
    "Audit and Compliance",
    "Frequently Asked Questions",
    "Related Policies",
    "Review Requirements",
    "Review Objectives",
    "Documentation",
    "Escalation",
    "Approval",
    "Retention Period",
    "Storage",
    "Security",
    "Destruction",
    "Payment Schedule",
    "Calculation",
    "Review",
    "Paid Time Off",
    "Approval Process",
    "Blackout Periods",
    "Unused PTO",
    "Meeting Requirements",
    "Meeting Owners",
    "Meeting Duration",
    "Action Items",
    "Fence Requirements",
    "Openings",
    "Gates",
    "Inspections",
    "Assessment",
    "Eligibility",
    "Replacement",
    "Preparation",
    "Materials",
    "Installation",
    "Inspection",
    "Approved Sources",
    "AI Usage",
    "Unknown Information",
    "Version Control",
    "Evaluation Criteria",
    "Estimates",
    "Onboarding Steps",
    "Responsibilities"
  ];

  return knownHeadings.filter((heading) => {
    const regex = new RegExp(`(^|\\n)\\s*${heading}\\s*(\\n|$)`, "i");
    return regex.test(text);
  });
}

/******************************************************************************
 * Public API
 ******************************************************************************/

function extractDocumentMetadata({ title = "", chunkText = "", chunkCount = 0 }) {
  const text = normalizeText(chunkText);

  const department =
    getLineValue(text, "Department") || titleToFallbackCategory(title);

  const owner =
    getLineValue(text, "Owner") || titleToFallbackOwner(title);

  const status =
    getLineValue(text, "Status") || "Unspecified";

  const revision =
    getLineValue(text, "Revision") ||
    getLineValue(text, "Version") ||
    "Unspecified";

  const effectiveDate =
    getLineValue(text, "Effective Date") || "Unspecified";

  const purpose =
    extractPurpose(text) || "No purpose statement detected.";

  const relatedPolicies = extractRelatedPolicies(text);

  const sectionHeadings = extractSectionHeadings(text);

  return {
    title,
    chunkCount,
    department,
    owner,
    status,
    revision,
    effectiveDate,
    purpose,
    relatedPolicies,
    sectionHeadings
  };
}

function extractDocumentSections(chunks = []) {
  return chunks.map((chunk, index) => {
    const text = normalizeText(chunk.chunk_text || chunk.chunkText || "");

    return {
      id: chunk.id,
      title: chunk.title,
      sectionNumber: index + 1,
      text,
      characterCount: text.length
    };
  });
}

module.exports = {
  extractDocumentMetadata,
  extractDocumentSections
};