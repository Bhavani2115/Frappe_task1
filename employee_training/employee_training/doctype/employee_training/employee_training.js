// Copyright (c) 2026, Bhavani and contributors
// For license information, please see license.txt

function parseCSV(text) {
	let lines = text.trim().split(/\r\n|\n/);
	if (lines.length < 2) return [];

	function splitCSVLine(line) {
		let result = [];
		let insideQuote = false;
		let entry = "";
		for (let i = 0; i < line.length; i++) {
			let char = line[i];
			if (char === '"') {
				if (insideQuote && line[i + 1] === '"') {
					entry += '"';
					i++;
				} else {
					insideQuote = !insideQuote;
				}
			} else if (char === "," && !insideQuote) {
				result.push(entry.trim());
				entry = "";
			} else {
				entry += char;
			}
		}
		result.push(entry.trim());
		return result;
	}

	let rawHeaders = splitCSVLine(lines[0]);
	let headerMap = {
		"employee id": "employee_id",
		"employee_id": "employee_id",
		"employee name": "employee_name",
		"employee_name": "employee_name",
		"department": "department",
		"training name": "training_name",
		"training_name": "training_name",
		"training type": "training_type",
		"training_type": "training_type",
		"training date": "training_date",
		"training_date": "training_date",
		"trainer name": "trainer_name",
		"trainer_name": "trainer_name",
		"duration (hours)": "duration_hours",
		"duration_hours": "duration_hours",
		"duration": "duration_hours",
		"status": "status",
		"description": "description",
		"feedback": "feedback",
		"is certified": "is_certified",
		"is_certified": "is_certified",
		"employee email": "employee_email",
		"employee_email": "employee_email",
	};

	let fieldnames = rawHeaders.map(
		(h) => headerMap[h.toLowerCase().trim()] || h.toLowerCase().replace(/\s+/g, "_")
	);

	let records = [];
	for (let i = 1; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		let values = splitCSVLine(lines[i]);
		let row = {};
		fieldnames.forEach((fn, idx) => {
			if (fn && values[idx] !== undefined) {
				let val = values[idx];
				if (fn === "duration_hours") {
					val = parseFloat(val) || 0.0;
				} else if (fn === "is_certified") {
					val = val === "1" || val.toLowerCase() === "yes" || val.toLowerCase() === "true" ? 1 : 0;
				}
				row[fn] = val;
			}
		});
		if (row.employee_id || row.training_name) {
			records.push(row);
		}
	}
	return records;
}

async function handle_csv_import(frm) {
	let input = document.createElement("input");
	input.type = "file";
	input.accept = ".csv";

	input.addEventListener("change", function (e) {
		let file = e.target.files[0];
		if (!file) return;

		let reader = new FileReader();
		reader.onload = async function (event) {
			let csvText = event.target.result;
			let rows = parseCSV(csvText);

			if (!rows || rows.length === 0) {
				frappe.msgprint(__("No valid records found in the selected CSV file."));
				return;
			}

			let total = rows.length;
			let imported_count = 0;
			let duplicate_count = 0;
			let invalid_count = 0;
			let errors = [];

			frappe.show_progress(__("Importing CSV"), 0, total, __("Starting import..."));

			for (let i = 0; i < total; i++) {
				let rowData = rows[i];
				frappe.show_progress(
					__("Importing CSV"),
					i + 1,
					total,
					`Processing row ${i + 1} of ${total}: ${rowData.employee_name || rowData.employee_id}`
				);

				// 1. Check for basic invalid data
				if (!rowData.employee_id || !rowData.employee_name || !rowData.training_name) {
					invalid_count++;
					errors.push(`Row ${i + 1}: Missing mandatory fields (Employee ID, Name, or Training Name)`);
					continue;
				}

				if (rowData.duration_hours !== undefined && rowData.duration_hours < 0) {
					invalid_count++;
					errors.push(`Row ${i + 1} (${rowData.employee_name}): Negative duration not allowed`);
					continue;
				}

				if (rowData.employee_email && !frappe.utils.validate_type(rowData.employee_email, "email")) {
					invalid_count++;
					errors.push(`Row ${i + 1} (${rowData.employee_name}): Invalid email format (${rowData.employee_email})`);
					continue;
				}

				// 2. Check for duplicate record
				try {
					let checkFilter = {
						employee_id: rowData.employee_id,
						training_name: rowData.training_name,
					};
					if (rowData.training_date) {
						checkFilter.training_date = rowData.training_date;
					}

					let existing = await frappe.db.get_value("Employee Training", checkFilter, "name");
					if (existing && existing.message && existing.message.name) {
						duplicate_count++;
						continue;
					}
				} catch (ex) {
					// continue
				}

				// 3. Insert record using standard Frappe client API
				try {
					let insertRes = await frappe.db.insert(Object.assign({ doctype: "Employee Training" }, rowData));
					if (insertRes) {
						imported_count++;
					}
				} catch (err) {
					invalid_count++;
					errors.push(`Row ${i + 1} (${rowData.employee_name}): Failed to insert`);
				}
			}

			frappe.hide_progress();

			let summaryHtml = `
				<div style="font-size: 14px; line-height: 1.6;">
					<p><strong>CSV Import Summary (${total} Total Rows Processed):</strong></p>
					<ul style="list-style-type: none; padding-left: 0;">
						<li style="padding: 4px 0;"><span style="color: #28a745; font-weight: bold;">✅ Successfully Imported:</span> ${imported_count}</li>
						<li style="padding: 4px 0;"><span style="color: #e0a800; font-weight: bold;">⚠️ Duplicates (Skipped):</span> ${duplicate_count}</li>
						<li style="padding: 4px 0;"><span style="color: #dc3545; font-weight: bold;">❌ Invalid / Errors:</span> ${invalid_count}</li>
					</ul>
					${errors.length > 0 ? `<div style="max-height: 140px; overflow-y: auto; background: #fff3cd; padding: 8px; border-radius: 4px; font-size: 12px; margin-top: 8px;"><strong>Details:</strong><br>${errors.join("<br>")}</div>` : ""}
				</div>
			`;

			frappe.msgprint({
				title: __("Import Complete"),
				message: summaryHtml,
				indicator: imported_count > 0 ? "green" : "orange",
			});

			if (frm && frm.reload_doc) {
				frm.reload_doc();
			}
		};

		reader.readAsText(file);
	});

	input.click();
}

function handle_csv_export() {
	frappe.call({
		method: "employee_training.employee_training.doctype.employee_training.employee_training.get_all_trainings",
		args: {},
		freeze: true,
		freeze_message: __("Preparing CSV export..."),
		callback: function (r) {
			if (!r.message || r.message.length === 0) {
				frappe.msgprint(__("No records to export."));
				return;
			}

			let records = r.message;
			let headers = [
				"Employee ID",
				"Employee Name",
				"Department",
				"Training Name",
				"Training Type",
				"Training Date",
				"Trainer Name",
				"Duration (Hours)",
				"Status",
				"Description",
				"Feedback",
				"Is Certified",
				"Employee Email",
			];

			let keys = [
				"employee_id",
				"employee_name",
				"department",
				"training_name",
				"training_type",
				"training_date",
				"trainer_name",
				"duration_hours",
				"status",
				"description",
				"feedback",
				"is_certified",
				"employee_email",
			];

			let csvRows = [headers.join(",")];

			records.forEach((row) => {
				let values = keys.map((k) => {
					let val = row[k] === null || row[k] === undefined ? "" : String(row[k]);
					val = val.replace(/"/g, '""');
					if (val.search(/("|,|\n)/g) >= 0) {
						val = `"${val}"`;
					}
					return val;
				});
				csvRows.push(values.join(","));
			});

			let csvString = csvRows.join("\n");
			let blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
			let url = URL.createObjectURL(blob);
			let link = document.createElement("a");
			link.setAttribute("href", url);
			link.setAttribute("download", `Employee_Training_Export_${frappe.datetime.now_date()}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			frappe.show_alert({
				message: __("Exported {0} training records successfully!", [records.length]),
				indicator: "green",
			});
		},
	});
}

function show_all_trainings_dialog() {
	frappe.call({
		method: "employee_training.employee_training.doctype.employee_training.employee_training.get_all_trainings",
		args: {},
		freeze: true,
		freeze_message: __("Fetching Employee Training records..."),
		callback: function (r) {
			if (r.message && r.message.length > 0) {
				let rows_html = r.message
					.map((row) => {
						let badge_color = "#6c757d";
						if (row.status === "Completed") badge_color = "#28a745";
						else if (row.status === "In Progress") badge_color = "#fd7e14";
						else if (row.status === "Cancelled") badge_color = "#dc3545";
						else if (row.status === "Scheduled") badge_color = "#17a2b8";

						let certified_badge = row.is_certified
							? '<span style="background-color: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Yes</span>'
							: '<span style="background-color: #6c757d; color: white; padding: 2px 8px; border-radius: 4px;">No</span>';

						return `
						<tr style="border-bottom: 1px solid #e2e8f0;">
							<td style="padding: 10px; font-weight: 600;">${row.name}</td>
							<td style="padding: 10px;">${row.employee_name || ""}<br><small style="color: #718096;">${row.employee_id || ""}</small></td>
							<td style="padding: 10px; font-weight: 500;">${row.training_name || ""}</td>
							<td style="padding: 10px;">${row.department || ""}</td>
							<td style="padding: 10px;">${row.training_type || ""}</td>
							<td style="padding: 10px;">${row.training_date || "-"}</td>
							<td style="padding: 10px;">${row.duration_hours || 0} hrs</td>
							<td style="padding: 10px;"><span style="background-color: ${badge_color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${row.status || ""}</span></td>
							<td style="padding: 10px;">${certified_badge}</td>
						</tr>
					`;
					})
					.join("");

				let dialog = new frappe.ui.Dialog({
					title: __("Employee Training Records ({0})", [r.message.length]),
					size: "large",
					fields: [
						{
							fieldtype: "HTML",
							fieldname: "trainings_table",
							options: `
								<div style="max-height: 420px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
									<table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
										<thead style="background-color: #f7fafc; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #cbd5e0;">
											<tr>
												<th style="padding: 10px;">ID</th>
												<th style="padding: 10px;">Employee</th>
												<th style="padding: 10px;">Training</th>
												<th style="padding: 10px;">Department</th>
												<th style="padding: 10px;">Type</th>
												<th style="padding: 10px;">Date</th>
												<th style="padding: 10px;">Duration</th>
												<th style="padding: 10px;">Status</th>
												<th style="padding: 10px;">Certified</th>
											</tr>
										</thead>
										<tbody>
											${rows_html}
										</tbody>
									</table>
								</div>
							`,
						},
					],
					primary_action_label: __("Close"),
					primary_action() {
						dialog.hide();
					},
				});

				dialog.show();
			} else {
				frappe.msgprint(__("No training records found."));
			}
		},
	});
}

frappe.ui.form.on("Employee Training", {
	refresh(frm) {
		// Existing View All Trainings button
		frm.add_custom_button(__("View All Trainings"), function () {
			show_all_trainings_dialog();
		});
		frm.change_custom_button_type(__("View All Trainings"), null, "primary");

		// Import CSV button
		frm.add_custom_button(__("Import CSV"), function () {
			handle_csv_import(frm);
		});

		// Export CSV button
		frm.add_custom_button(__("Export CSV"), function () {
			handle_csv_export();
		});
	},

	fetch_trainings_btn(frm) {
		show_all_trainings_dialog();
	},
});
