// Copyright (c) 2026, Bhavani and contributors
// For license information, please see license.txt

frappe.query_reports["Employee Training Summary"] = {
	filters: [
		{
			fieldname: "department",
			label: __("Department"),
			fieldtype: "Select",
			options: "\nEngineering\nHuman Resources\nMarketing\nSales\nFinance\nOperations",
			reqd: 0
		},
		{
			fieldname: "training_type",
			label: __("Training Type"),
			fieldtype: "Select",
			options: "\nTechnical\nSoft Skills\nCompliance\nLeadership\nOnboarding",
			reqd: 0
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: "\nScheduled\nIn Progress\nCompleted\nCancelled",
			reqd: 0
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			reqd: 0
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			reqd: 0
		},
		{
			fieldname: "is_certified",
			label: __("Certified"),
			fieldtype: "Select",
			options: "\nYes\nNo",
			reqd: 0
		}
	],

	onload(report) {
		// Add prominent one-click Export buttons to Report page toolbar
		report.page.add_inner_button(__("Export to CSV"), function () {
			report.export_report("CSV");
		});

		report.page.add_inner_button(__("Export to Excel"), function () {
			report.export_report("Excel");
		});
	}
};
