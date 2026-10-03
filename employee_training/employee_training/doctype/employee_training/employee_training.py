# Copyright (c) 2026, Bhavani and contributors
# For license information, please see license.txt

import logging
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import validate_email_address

logger = frappe.logger("employee_training", allow_site=True, file_count=50)
logger.setLevel(logging.INFO)


class EmployeeTraining(Document):
	def validate(self):
		"""Validate Employee Training document before saving."""
		# 1. Validate Email format if employee_email is provided
		if self.employee_email:
			validate_email_address(self.employee_email, throw=True)

		# 2. Validate duration is non-negative
		if self.duration_hours is not None and self.duration_hours < 0:
			frappe.throw(_("Duration (Hours) cannot be negative."))

		# 3. Handle Duplicate Records: Check if record already exists for this Employee + Training
		duplicate_filter = {
			"employee_id": self.employee_id,
			"training_name": self.training_name,
			"name": ["!=", self.name or ""],
		}
		if self.training_date:
			duplicate_filter["training_date"] = self.training_date

		existing_record = frappe.db.get_value("Employee Training", duplicate_filter, "name")
		if existing_record:
			frappe.throw(
				_(
					"Duplicate Record: A training record '{0}' already exists for Employee {1} ({2}) in '{3}'."
				).format(existing_record, self.employee_name, self.employee_id, self.training_name),
				frappe.DuplicateEntryError,
			)

		# 4. Validation logic: If status is Completed and certified, log notice
		if self.status == "Completed" and self.is_certified:
			logger.info(
				f"[Employee Training] Certified completion recorded for {self.employee_name} ({self.employee_id}) in '{self.training_name}'"
			)

		# Log validation event
		logger.info(
			f"[Employee Training Validate] Doc: {self.name or 'New'}, Employee: {self.employee_name} ({self.employee_id}), Training: {self.training_name}, Status: {self.status}"
		)

	def before_save(self):
		"""Hook before document is saved to the database."""
		logger.info(
			f"[Employee Training Before Save] Saving record for Employee ID: {self.employee_id}, Training: {self.training_name}"
		)

	def on_update(self):
		"""Hook after document is updated."""
		logger.info(
			f"[Employee Training On Update] Record {self.name} updated successfully. Status is '{self.status}'"
		)
		# Create a Frappe Error / Activity Log for tracking
		frappe.log_error(
			title=f"Employee Training Event: {self.name}",
			message=f"Employee {self.employee_name} ({self.employee_id}) updated training '{self.training_name}' with status '{self.status}'."
		)

	@frappe.whitelist()
	def get_summary(self):
		"""Instance method returning summary of this training record."""
		logger.info(f"[Employee Training API] get_summary called for {self.name}")
		return {
			"name": self.name,
			"employee_id": self.employee_id,
			"employee_name": self.employee_name,
			"department": self.department,
			"training_name": self.training_name,
			"training_type": self.training_type,
			"training_date": str(self.training_date) if self.training_date else None,
			"trainer_name": self.trainer_name,
			"duration_hours": self.duration_hours,
			"status": self.status,
			"is_certified": self.is_certified,
			"employee_email": self.employee_email,
			"description": self.description,
			"feedback": self.feedback,
		}


@frappe.whitelist()
def get_all_trainings(employee_id=None, department=None, status=None):
	"""
	Whitelisted API to fetch Employee Training records.
	Can filter by employee_id, department, or status.
	"""
	filters = {}
	if employee_id:
		filters["employee_id"] = employee_id
	if department:
		filters["department"] = department
	if status:
		filters["status"] = status

	records = frappe.get_all(
		"Employee Training",
		filters=filters,
		fields=[
			"name",
			"employee_id",
			"employee_name",
			"department",
			"training_name",
			"training_type",
			"training_date",
			"trainer_name",
			"duration_hours",
			"status",
			"is_certified",
			"employee_email",
			"description",
			"feedback",
			"creation",
			"modified",
		],
		order_by="creation desc",
	)

	logger.info(
		f"[Employee Training API] Fetched {len(records)} records with filters: {filters}"
	)

	return records
