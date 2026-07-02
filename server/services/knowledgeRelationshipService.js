/******************************************************************************
 * File: knowledgeRelationshipService.js
 * Layer: Domain Service
 * Responsibility:
 * Provides relationship navigation between enterprise knowledge documents.
 *
 * NOTE:
 * Relationships are currently hardcoded while the Knowledge Explorer is
 * developed. Later versions will infer relationships from metadata,
 * semantic similarity, citations, and governance information stored in
 * Supabase.
 ******************************************************************************/

const relationships = {

  /**************************************************************************
   * Tax Operations
   **************************************************************************/

  "Client Onboarding Standard Operating Procedure.pdf": [
    "Business Tax Intake Guide.pdf",
    "Individual Tax Preparation Guide.pdf",
    "Tax Return Review Procedure.pdf",
    "Client Document Retention Policy.pdf"
  ],

  "Business Tax Intake Guide.pdf": [
    "Client Onboarding Standard Operating Procedure.pdf",
    "Tax Return Review Procedure.pdf",
    "Estimated Tax Payment Guide.pdf"
  ],

  "Individual Tax Preparation Guide.pdf": [
    "Client Onboarding Standard Operating Procedure.pdf",
    "Tax Return Review Procedure.pdf"
  ],

  "Tax Return Review Procedure.pdf": [
    "Business Tax Intake Guide.pdf",
    "Individual Tax Preparation Guide.pdf",
    "Client Document Retention Policy.pdf"
  ],

  "Client Document Retention Policy.pdf": [
    "Client Onboarding Standard Operating Procedure.pdf",
    "Tax Return Review Procedure.pdf"
  ],

  "Estimated Tax Payment Guide.pdf": [
    "Business Tax Intake Guide.pdf"
  ],

  "Tax_Firm_AI_Brain_Test.pdf": [
    "Client Onboarding Standard Operating Procedure.pdf",
    "Business Tax Intake Guide.pdf",
    "Tax Return Review Procedure.pdf"
  ],

  /**************************************************************************
   * Finance
   **************************************************************************/

  "Employee Expense Reimbursement Policy.pdf": [
    "Travel Policy",
    "Expense Report Policy.pdf"
  ],

  "Expense Report Policy.pdf": [
    "Employee Expense Reimbursement Policy.pdf",
    "Travel Policy"
  ],

  "Travel Policy": [
    "Employee Expense Reimbursement Policy.pdf",
    "Expense Report Policy.pdf"
  ],

  /**************************************************************************
   * Human Resources
   **************************************************************************/

  "Vacation and Leave Policy.pdf": [
    "Remote Work Policy"
  ],

  "Remote Work Policy": [
    "Vacation and Leave Policy.pdf"
  ],

  /**************************************************************************
   * Knowledge Management
   **************************************************************************/

  "Knowledge Management Policy.pdf": [
    "Meeting Management Policy.pdf"
  ],

  "Meeting Management Policy.pdf": [
    "Knowledge Management Policy.pdf"
  ],

  /**************************************************************************
   * Facilities
   **************************************************************************/

  "Contractor Selection Policy.pdf": [
    "Bathroom Renovation Procedure.pdf",
    "Flooring Installation Guide.pdf",
    "Driveway Resurfacing SOP.pdf",
    "Pool Fence Compliance Guide.pdf"
  ],

  "Bathroom Renovation Procedure.pdf": [
    "Contractor Selection Policy.pdf",
    "Flooring Installation Guide.pdf"
  ],

  "Flooring Installation Guide.pdf": [
    "Bathroom Renovation Procedure.pdf",
    "Contractor Selection Policy.pdf"
  ],

  "Driveway Resurfacing SOP.pdf": [
    "Contractor Selection Policy.pdf"
  ],

  "Pool Fence Compliance Guide.pdf": [
    "Contractor Selection Policy.pdf"
  ],

  /**************************************************************************
   * Procurement
   **************************************************************************/

  "Vendor Approval Policy.pdf": [
    "Employee Expense Reimbursement Policy.pdf",
    "Travel Policy",
    "Contractor Selection Policy.pdf"
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