/******************************************************************************
 * File: knowledgeRelationshipService.js
 * Layer: Domain Service
 * Responsibility:
 * Provides relationship navigation between enterprise knowledge documents.
 *
 * NOTE:
 * Relationships are currently hardcoded while the Knowledge Explorer is
 * developed. Later versions will infer relationships from metadata,
 * references, and governance information stored in Supabase.
 ******************************************************************************/

const relationships = {
  "Client Onboarding Standard Operating Procedure.pdf - Part 1": [
    "Business Tax Intake Guide.pdf - Part 1",
    "Individual Tax Preparation Guide.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1",
    "Client Document Retention Policy.pdf - Part 1"
  ],

  "Business Tax Intake Guide.pdf - Part 1": [
    "Client Onboarding Standard Operating Procedure.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1",
    "Estimated Tax Payment Guide.pdf - Part 1"
  ],

  "Individual Tax Preparation Guide.pdf - Part 1": [
    "Client Onboarding Standard Operating Procedure.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1"
  ],

  "Tax Return Review Procedure.pdf - Part 1": [
    "Business Tax Intake Guide.pdf - Part 1",
    "Individual Tax Preparation Guide.pdf - Part 1",
    "Client Document Retention Policy.pdf - Part 1"
  ],

  "Employee Expense Reimbursement Policy.pdf - Part 1": [
    "Travel Policy",
    "Expense Report Policy.pdf - Part 1"
  ],

  "Travel Policy": [
    "Employee Expense Reimbursement Policy.pdf - Part 1",
    "Expense Report Policy.pdf - Part 1"
  ],

  "Expense Report Policy.pdf - Part 1": [
    "Employee Expense Reimbursement Policy.pdf - Part 1",
    "Travel Policy"
  ],

  "Vacation and Leave Policy.pdf - Part 1": [
    "Remote Work Policy"
  ],

  "Remote Work Policy": [
    "Vacation and Leave Policy.pdf - Part 1"
  ],

  "Knowledge Management Policy.pdf - Part 1": [
    "Meeting Management Policy.pdf - Part 1"
  ],

  "Meeting Management Policy.pdf - Part 1": [
    "Knowledge Management Policy.pdf - Part 1"
  ],

  "Contractor Selection Policy.pdf - Part 1": [
    "Bathroom Renovation Procedure.pdf - Part 1",
    "Flooring Installation Guide.pdf - Part 1",
    "Driveway Resurfacing SOP.pdf - Part 1",
    "Pool Fence Compliance Guide.pdf - Part 1"
  ],

  "Bathroom Renovation Procedure.pdf - Part 1": [
    "Contractor Selection Policy.pdf - Part 1",
    "Flooring Installation Guide.pdf - Part 1"
  ],

  "Flooring Installation Guide.pdf - Part 1": [
    "Bathroom Renovation Procedure.pdf - Part 1",
    "Contractor Selection Policy.pdf - Part 1"
  ],

  "Driveway Resurfacing SOP.pdf - Part 1": [
    "Contractor Selection Policy.pdf - Part 1"
  ],

  "Pool Fence Compliance Guide.pdf - Part 1": [
    "Contractor Selection Policy.pdf - Part 1"
  ],

  "Tax_Firm_AI_Brain_Test.pdf - Part 1": [
    "Client Onboarding Standard Operating Procedure.pdf - Part 1",
    "Business Tax Intake Guide.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1"
  ],

  "Tax_Firm_AI_Brain_Test.pdf - Part 2": [
    "Client Onboarding Standard Operating Procedure.pdf - Part 1",
    "Business Tax Intake Guide.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1"
  ],

  "Tax_Firm_AI_Brain_Test.pdf - Part 3": [
    "Client Onboarding Standard Operating Procedure.pdf - Part 1",
    "Business Tax Intake Guide.pdf - Part 1",
    "Tax Return Review Procedure.pdf - Part 1"
  ]
};

/******************************************************************************
 * Public API
 ******************************************************************************/

function getRelatedDocuments(title) {
  return relationships[title] || [];
}

module.exports = {
  getRelatedDocuments
};