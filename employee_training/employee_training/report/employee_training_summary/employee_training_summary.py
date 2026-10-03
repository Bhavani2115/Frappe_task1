# Copyright (c) 2026, Bhavani and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
	filters = filters or {}
	columns = get_columns()
	data = get_data(filters)
	report_summary = get_report_summary(data)
	chart = get_chart_data(data)

	return columns, data, None, chart, report_summary


def get_columns():
	return [
		{
			"label": _("Training ID"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "Employee Training",
			"width": 110,
		},
		{
			"label": _("Employee ID"),
			"fieldname": "employee_id",
			"fieldtype": "Data",
			"width": 100,
		},
		{
			"label": _("Employee Name"),
			"fieldname": "employee_name",
			"fieldtype": "Data",
			"width": 140,
		},
		{
			"label": _("Department"),
			"fieldname": "department",
			"fieldtype": "Data",
			"width": 130,
		},
		{
			"label": _("Training Name"),
			"fieldname": "training_name",
			"fieldtype": "Data",
			"width": 220,
		},
		{
			"label": _("Training Type"),
			"fieldname": "training_type",
			"fieldtype": "Data",
			"width": 120,
		},
		{
			"label": _("Date"),
			"fieldname": "training_date",
			"fieldtype": "Date",
			"width": 100,
		},
		{
			"label": _("Trainer Name"),
			"fieldname": "trainer_name",
			"fieldtype": "Data",
			"width": 130,
		},
		{
			"label": _("Duration (Hours)"),
			"fieldname": "duration_hours",
			"fieldtype": "Float",
			"width": 120,
		},
		{
			"label": _("Status"),
			"fieldname": "status",
			"fieldtype": "Data",
			"width": 110,
		},
		{
			"label": _("Certified"),
			"fieldname": "certified_str",
			"fieldtype": "Data",
			"width": 90,
		},
		{
			"label": _("Employee Email"),
			"fieldname": "employee_email",
			"fieldtype": "Data",
			"width": 170,
		},
	]


def get_data(filters):
	conditions = []
	values = {}

	if filters.get("department"):
		conditions.append("department = %(department)s")
		values["department"] = filters["department"]

	if filters.get("training_type"):
		conditions.append("training_type = %(training_type)s")
		values["training_type"] = filters["training_type"]

	if filters.get("status"):
		conditions.append("status = %(status)s")
		values["status"] = filters["status"]

	if filters.get("from_date"):
		conditions.append("training_date >= %(from_date)s")
		values["from_date"] = filters["from_date"]

	if filters.get("to_date"):
		conditions.append("training_date <= %(to_date)s")
		values["to_date"] = filters["to_date"]

	if filters.get("is_certified"):
		if filters["is_certified"] == "Yes":
			conditions.append("is_certified = 1")
		elif filters["is_certified"] == "No":
			conditions.append("is_certified = 0")

	where_clause = ""
	if conditions:
		where_clause = "WHERE " + " AND ".join(conditions)

	query = f"""
		SELECT 
			name,
			employee_id,
			employee_name,
			department,
			training_name,
			training_type,
			training_date,
			trainer_name,
			duration_hours,
			status,
			is_certified,
			CASE WHEN is_certified = 1 THEN 'Yes' ELSE 'No' END AS certified_str,
			employee_email
		FROM `tabEmployee Training`
		{where_clause}
		ORDER BY training_date DESC, creation DESC
	"""

	records = frappe.db.sql(query, values, as_dict=1)
	return records


def get_report_summary(data):
	if not data:
		return []

	total_records = len(data)
	total_hours = sum(d.get("duration_hours") or 0.0 for d in data)
	completed_count = sum(1 for d in data if d.get("status") == "Completed")
	certified_count = sum(1 for d in data if d.get("is_certified") == 1)

	return [
		{"value": total_records, "label": _("Total Trainings"), "datatype": "Int"},
		{"value": total_hours, "label": _("Total Hours"), "datatype": "Float"},
		{"value": completed_count, "label": _("Completed"), "datatype": "Int", "indicator": "Green"},
		{"value": certified_count, "label": _("Certified"), "datatype": "Int", "indicator": "Blue"},
	]


def get_chart_data(data):
	if not data:
		return None

	# Department breakdown
	dept_counts = {}
	for d in data:
		dept = d.get("department") or _("Unassigned")
		dept_counts[dept] = dept_counts.get(dept, 0) + 1

	labels = list(dept_counts.keys())
	values = list(dept_counts.values())

	return {
		"data": {
			"labels": labels,
			"datasets": [{"name": _("Trainings"), "values": values}],
		},
		"type": "bar",
		"colors": ["#456789"],
	}
