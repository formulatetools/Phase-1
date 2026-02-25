/**
 * Generates a self-contained, interactive HTML file from a WorksheetSchema.
 * Clients can open the file in any browser and complete the worksheet offline.
 * Includes Formulate branding, interactive fields (sliders, tables, decision trees),
 * and localStorage persistence so progress is saved between sessions.
 */
import type {
  WorksheetSchema,
  WorksheetSection,
  WorksheetField,
  LikertField,
  ChecklistField,
  SelectField,
  NumberField,
  TableField,
  HierarchyField,
  SafetyPlanField,
  DecisionTreeField,
  FormulationField,
  TableColumn,
} from '@/types/worksheet'

// ── Utilities ──

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitize(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
}

// ── CSS ──

function generateCss(): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --text-900: #0f172a;
      --text-800: #1e293b;
      --text-700: #334155;
      --text-600: #475569;
      --text-500: #64748b;
      --text-400: #94a3b8;
      --text-300: #cbd5e1;
      --brand: #e4a930;
      --brand-light: #fdf6e3;
      --green: #16a34a;
      --green-light: #f0fdf4;
      --green-border: #bbf7d0;
      --red: #dc2626;
      --red-light: #fef2f2;
      --red-border: #fecaca;
      --amber-light: #fff7ed;
      --radius: 12px;
      --radius-sm: 8px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text-800);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container { max-width: 640px; margin: 0 auto; padding: 0 16px; }

    /* Header */
    header {
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      padding: 12px 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-icon { flex-shrink: 0; }
    .logo-text { font-size: 14px; font-weight: 600; color: var(--text-800); }

    /* Main */
    main { padding: 32px 0; }

    .worksheet-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-900);
      margin-bottom: 8px;
    }
    .worksheet-description {
      font-size: 14px;
      color: var(--text-500);
      margin-bottom: 16px;
    }
    .worksheet-instructions {
      background: var(--brand-light);
      border: 1px solid rgba(228, 169, 48, 0.2);
      border-radius: var(--radius);
      padding: 16px;
      font-size: 14px;
      color: var(--text-700);
      margin-bottom: 24px;
    }

    /* Sections */
    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-900);
      margin-bottom: 4px;
    }
    .section-description {
      font-size: 13px;
      color: var(--text-500);
      margin-bottom: 16px;
    }

    /* Fields */
    .field { margin-bottom: 20px; }
    .field:last-child { margin-bottom: 0; }
    .field-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-700);
      margin-bottom: 6px;
    }
    .field-label .required { color: var(--red); margin-left: 2px; }

    input[type="text"],
    input[type="number"],
    input[type="date"],
    input[type="time"],
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text-800);
      transition: border-color 0.15s, box-shadow 0.15s;
      outline: none;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(228, 169, 48, 0.15);
    }
    textarea { resize: vertical; min-height: 100px; }

    /* Likert / Range */
    .likert-wrap { padding: 4px 0; }
    .likert-value {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-900);
      margin-bottom: 4px;
    }
    .likert-value small { font-size: 13px; font-weight: 400; color: var(--text-400); }
    input[type="range"] {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: var(--brand);
      cursor: pointer;
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: var(--brand);
      cursor: pointer;
      border: none;
    }
    .likert-anchors {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-400);
    }

    /* Checklist */
    .checklist-group { display: flex; flex-direction: column; gap: 8px; }
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s;
    }
    .checklist-item:hover { background: var(--border-light); }
    .checklist-item input[type="checkbox"] {
      width: 18px; height: 18px;
      accent-color: var(--brand);
      cursor: pointer;
    }
    .checklist-item label { cursor: pointer; font-size: 14px; flex: 1; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      font-size: 12px;
      color: var(--text-500);
      background: var(--border-light);
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-light);
      vertical-align: top;
    }
    td input, td textarea {
      border: 1px solid transparent;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    td input:focus, td textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 2px rgba(228, 169, 48, 0.1);
    }
    td textarea { min-height: 60px; }
    .row-num {
      width: 32px;
      text-align: center;
      color: var(--text-400);
      font-size: 12px;
    }
    .row-remove {
      width: 32px;
      text-align: center;
    }
    .row-remove button {
      background: none;
      border: none;
      color: var(--text-300);
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
    .row-remove button:hover { color: var(--red); background: var(--red-light); }
    .table-actions { margin-top: 8px; }
    .btn-add-row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-family: inherit;
      color: var(--text-600);
      background: var(--border-light);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-add-row:hover { background: var(--border); }

    /* Computed */
    .computed-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--amber-light);
      border: 1px dashed var(--brand);
      border-radius: var(--radius-sm);
      font-size: 14px;
      color: var(--text-600);
    }
    .computed-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--brand);
      background: var(--brand-light);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Safety plan */
    .safety-step {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .step-circle {
      flex-shrink: 0;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--text-800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .step-circle.red { background: var(--red); }
    .step-content { flex: 1; }
    .step-label { font-size: 15px; font-weight: 600; color: var(--text-900); margin-bottom: 4px; }
    .step-hint { font-size: 13px; color: var(--text-400); font-style: italic; margin-bottom: 8px; }

    /* Decision tree */
    .decision-question {
      background: var(--amber-light);
      border: 2px solid var(--brand);
      border-radius: var(--radius);
      padding: 16px;
      text-align: center;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .decision-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
    }
    .decision-btn {
      padding: 8px 24px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: var(--surface);
      transition: all 0.15s;
    }
    .decision-btn.yes:hover, .decision-btn.yes.active {
      border-color: var(--green);
      background: var(--green-light);
      color: var(--green);
    }
    .decision-btn.no:hover, .decision-btn.no.active {
      border-color: var(--red);
      background: var(--red-light);
      color: var(--red);
    }
    .decision-branch { display: none; }
    .decision-branch.visible { display: block; }
    .decision-outcome {
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 500;
      margin-top: 12px;
    }
    .decision-outcome.green { background: var(--green-light); border: 1px solid var(--green-border); color: var(--green); }
    .decision-outcome.red { background: var(--red-light); border: 1px solid var(--red-border); color: var(--red); }

    /* Formulation simplified */
    .formulation-section {
      border-left: 3px solid var(--brand);
      padding-left: 16px;
      margin-bottom: 16px;
    }
    .formulation-domain {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-400);
      margin-bottom: 6px;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 24px 0;
      text-align: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-400);
    }

    /* Save indicator */
    .save-indicator {
      position: fixed;
      bottom: 16px;
      right: 16px;
      padding: 8px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--text-400);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .save-indicator.visible { opacity: 1; }

    /* Print styles */
    @media print {
      body { background: white; }
      .section { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
      .save-indicator { display: none; }
      header { border-bottom: 2px solid var(--brand); }
      footer { border-top: 2px solid var(--brand); }
      input[type="range"] { display: none; }
      .likert-value { font-size: 16px; }
    }
  `
}

// ── Logo SVG (matches LogoIcon) ──

const LOGO_SVG = `<svg width="20" height="20" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(0, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
  <g transform="rotate(120, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
  <g transform="rotate(240, 22, 22)"><path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" stroke="#e4a930" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" stroke="#e4a930" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
</svg>`

// ── Field renderers ──

function renderTextField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="text" id="${esc(field.id)}" name="${esc(field.id)}" placeholder="${esc(field.placeholder || '')}" />
  </div>`
}

function renderTextareaField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <textarea id="${esc(field.id)}" name="${esc(field.id)}" rows="4" placeholder="${esc(field.placeholder || '')}"></textarea>
  </div>`
}

function renderNumberField(field: NumberField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const attrs = [
    field.min !== undefined ? `min="${field.min}"` : '',
    field.max !== undefined ? `max="${field.max}"` : '',
    field.step !== undefined ? `step="${field.step}"` : '',
  ].filter(Boolean).join(' ')
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="number" id="${esc(field.id)}" name="${esc(field.id)}" ${attrs} placeholder="${esc(field.placeholder || '')}" />
  </div>`
}

function renderDateField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="date" id="${esc(field.id)}" name="${esc(field.id)}" />
  </div>`
}

function renderTimeField(field: WorksheetField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <input type="time" id="${esc(field.id)}" name="${esc(field.id)}" />
  </div>`
}

function renderSelectField(field: SelectField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const opts = field.options.map(o =>
    `<option value="${esc(o.id)}">${esc(o.label)}</option>`
  ).join('')
  return `<div class="field">
    <label class="field-label" for="${esc(field.id)}">${esc(field.label)}${req}</label>
    <select id="${esc(field.id)}" name="${esc(field.id)}">
      <option value="">Select…</option>
      ${opts}
    </select>
  </div>`
}

function renderChecklistField(field: ChecklistField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const items = field.options.map(o => `
    <div class="checklist-item">
      <input type="checkbox" id="${esc(field.id)}_${esc(o.id)}" name="${esc(field.id)}" value="${esc(o.id)}" />
      <label for="${esc(field.id)}_${esc(o.id)}">${esc(o.label)}</label>
    </div>
  `).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="checklist-group">${items}</div>
  </div>`
}

function renderLikertField(field: LikertField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const step = field.step || 1
  // Build anchor labels
  let anchorsHtml = ''
  if (field.anchors) {
    const entries = Object.entries(field.anchors)
    if (entries.length >= 2) {
      anchorsHtml = `<div class="likert-anchors">
        <span>${esc(entries[0][1])}</span>
        <span>${esc(entries[entries.length - 1][1])}</span>
      </div>`
    }
  }
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="likert-wrap">
      <div class="likert-value"><span id="${esc(field.id)}-val">${field.min}</span> <small>/ ${field.max}</small></div>
      <input type="range" id="${esc(field.id)}" name="${esc(field.id)}" min="${field.min}" max="${field.max}" step="${step}" value="${field.min}" data-likert="true" />
      ${anchorsHtml}
    </div>
  </div>`
}

function renderTableColumnHeaders(columns: TableColumn[]): string {
  const headers = columns.map(c => `<th>${esc(c.header)}</th>`).join('')
  return `<th class="row-num">#</th>${headers}<th class="row-remove"></th>`
}

function renderTableRow(fieldId: string, columns: TableColumn[], rowIndex: number): string {
  const cells = columns.map(c => {
    const cellId = `${fieldId}_r${rowIndex}_${c.id}`
    const attrs = [
      c.min !== undefined ? `min="${c.min}"` : '',
      c.max !== undefined ? `max="${c.max}"` : '',
      c.step !== undefined ? `step="${c.step}"` : '',
    ].filter(Boolean).join(' ')
    if (c.type === 'textarea') {
      return `<td><textarea id="${esc(cellId)}" name="${esc(cellId)}" rows="2" placeholder="${esc(c.header)}"></textarea></td>`
    }
    if (c.type === 'number') {
      return `<td><input type="number" id="${esc(cellId)}" name="${esc(cellId)}" ${attrs} placeholder="${esc(c.header)}" /></td>`
    }
    return `<td><input type="text" id="${esc(cellId)}" name="${esc(cellId)}" placeholder="${esc(c.header)}" /></td>`
  }).join('')
  return `<tr data-row="${rowIndex}">
    <td class="row-num">${rowIndex + 1}</td>
    ${cells}
    <td class="row-remove"><button type="button" onclick="removeRow(this)" title="Remove row">&times;</button></td>
  </tr>`
}

function renderTableField(field: TableField): string {
  const req = field.required ? '<span class="required">*</span>' : ''
  const minRows = field.min_rows || 1
  const maxRows = field.max_rows || 20
  const rows = Array.from({ length: minRows }, (_, i) =>
    renderTableRow(field.id, field.columns, i)
  ).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="table-wrap">
      <table data-table="${esc(field.id)}" data-max-rows="${maxRows}" data-min-rows="${minRows}">
        <thead><tr>${renderTableColumnHeaders(field.columns)}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="table-actions">
      <button type="button" class="btn-add-row" onclick="addRow('${esc(field.id)}')" data-add-for="${esc(field.id)}">+ Add row</button>
    </div>
  </div>`
}

function renderHierarchyField(field: HierarchyField): string {
  // Hierarchy renders as a table — sorting handled by JS
  const req = field.required ? '<span class="required">*</span>' : ''
  const minRows = field.min_rows || 3
  const maxRows = field.max_rows || 15
  const rows = Array.from({ length: minRows }, (_, i) =>
    renderTableRow(field.id, field.columns, i)
  ).join('')
  return `<div class="field">
    <label class="field-label">${esc(field.label)}${req}</label>
    <div class="table-wrap">
      <table data-table="${esc(field.id)}" data-max-rows="${maxRows}" data-min-rows="${minRows}" data-hierarchy="${field.sort_by || ''}" data-sort-dir="${field.sort_direction || 'asc'}">
        <thead><tr>${renderTableColumnHeaders(field.columns)}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="table-actions">
      <button type="button" class="btn-add-row" onclick="addRow('${esc(field.id)}')" data-add-for="${esc(field.id)}">+ Add row</button>
    </div>
  </div>`
}

function renderComputedField(field: WorksheetField): string {
  return `<div class="field">
    <label class="field-label">${esc(field.label)}</label>
    <div class="computed-display">
      <span class="computed-badge">f</span>
      <span>This value is calculated automatically when completed online.</span>
    </div>
  </div>`
}

function renderSafetyPlanField(field: SafetyPlanField): string {
  return field.steps.map(step => {
    const circleClass = step.highlight === 'red' ? 'step-circle red' : 'step-circle'
    const fields = step.fields.map(f => `
      <textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>
    `).join('')
    return `<div class="safety-step">
      <div class="${circleClass}">${step.step}</div>
      <div class="step-content">
        <div class="step-label">${esc(step.label)}</div>
        ${step.hint ? `<div class="step-hint">${esc(step.hint)}</div>` : ''}
        ${fields}
      </div>
    </div>`
  }).join('')
}

function renderDecisionTreeField(field: DecisionTreeField): string {
  const treeId = field.id
  const yesFields = (field.branches.yes.fields || []).map(f => `
    <div class="field" style="margin-top:12px;">
      <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
      ${f.type === 'textarea'
        ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
        : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
      }
    </div>
  `).join('')
  const noFields = (field.branches.no.fields || []).map(f => `
    <div class="field" style="margin-top:12px;">
      <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
      ${f.type === 'textarea'
        ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
        : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
      }
    </div>
  `).join('')

  return `<div class="field">
    <div class="decision-question">${esc(field.question)}</div>
    <div class="decision-buttons">
      <button type="button" class="decision-btn yes" data-tree="${esc(treeId)}" data-branch="yes" onclick="selectBranch('${esc(treeId)}','yes')">
        ${esc(field.branches.yes.label)}
      </button>
      <button type="button" class="decision-btn no" data-tree="${esc(treeId)}" data-branch="no" onclick="selectBranch('${esc(treeId)}','no')">
        ${esc(field.branches.no.label)}
      </button>
    </div>
    <div class="decision-branch" id="${esc(treeId)}-yes">
      ${yesFields}
      <div class="decision-outcome green">${esc(field.branches.yes.outcome)}</div>
    </div>
    <div class="decision-branch" id="${esc(treeId)}-no">
      ${noFields}
      <div class="decision-outcome red">${esc(field.branches.no.outcome)}</div>
    </div>
  </div>`
}

function renderFormulationField(field: FormulationField): string {
  // Simplified: show as labeled sections rather than the full visual diagram
  const domainLabel = field.domain
    ? field.domain.charAt(0).toUpperCase() + field.domain.slice(1)
    : field.label
  return `<div class="field">
    <div class="formulation-section">
      <div class="formulation-domain">${esc(domainLabel)}</div>
      <textarea id="${esc(field.id)}" name="${esc(field.id)}" rows="3" placeholder="${esc(field.placeholder || `Enter ${domainLabel.toLowerCase()}…`)}"></textarea>
    </div>
  </div>`
}

// ── Dispatch field rendering ──

function renderField(field: WorksheetField): string {
  switch (field.type) {
    case 'text': return renderTextField(field)
    case 'textarea': return renderTextareaField(field)
    case 'number': return renderNumberField(field as NumberField)
    case 'date': return renderDateField(field)
    case 'time': return renderTimeField(field)
    case 'select': return renderSelectField(field as SelectField)
    case 'checklist': return renderChecklistField(field as ChecklistField)
    case 'likert': return renderLikertField(field as LikertField)
    case 'table': return renderTableField(field as TableField)
    case 'hierarchy': return renderHierarchyField(field as HierarchyField)
    case 'computed': return renderComputedField(field)
    case 'safety_plan': return renderSafetyPlanField(field as SafetyPlanField)
    case 'decision_tree': return renderDecisionTreeField(field as DecisionTreeField)
    case 'formulation': return renderFormulationField(field as FormulationField)
    default: return ''
  }
}

// ── Section rendering ──

function renderSection(section: WorksheetSection): string {
  const title = section.title
    ? `<div class="section-title">${esc(section.title)}</div>`
    : ''
  const desc = section.description
    ? `<div class="section-description">${esc(section.description)}</div>`
    : ''
  const fields = section.fields.map(renderField).join('')
  return `<div class="section">${title}${desc}${fields}</div>`
}

// ── Layout dispatchers ──

function renderSafetyPlanLayout(schema: WorksheetSchema): string {
  return schema.sections.map(section => {
    const circleClass = section.highlight === 'red' ? 'step-circle red' : 'step-circle'
    const fields = section.fields.map(f => {
      if (f.type === 'safety_plan') return renderSafetyPlanField(f as SafetyPlanField)
      return renderField(f)
    }).join('')
    if (section.step) {
      return `<div class="section"><div class="safety-step">
        <div class="${circleClass}">${section.step}</div>
        <div class="step-content">
          <div class="step-label">${esc(section.label || section.title || '')}</div>
          ${section.hint ? `<div class="step-hint">${esc(section.hint)}</div>` : ''}
          ${fields}
        </div>
      </div></div>`
    }
    return renderSection(section)
  }).join('')
}

function renderDecisionTreeLayout(schema: WorksheetSchema): string {
  return schema.sections.map(section => {
    // If section has decision tree structure at section level
    if (section.type === 'branch' && section.question && section.branches) {
      const treeId = section.id
      const yesFields = (section.branches.yes.fields || []).map(f => `
        <div class="field" style="margin-top:12px;">
          <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
            : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
          }
        </div>
      `).join('')
      const noFields = (section.branches.no.fields || []).map(f => `
        <div class="field" style="margin-top:12px;">
          <label class="field-label" for="${esc(f.id)}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="3" placeholder="${esc(f.placeholder || '')}"></textarea>`
            : `<input type="text" id="${esc(f.id)}" name="${esc(f.id)}" placeholder="${esc(f.placeholder || '')}" />`
          }
        </div>
      `).join('')
      return `<div class="section">
        <div class="decision-question">${esc(section.question)}</div>
        <div class="decision-buttons">
          <button type="button" class="decision-btn yes" data-tree="${esc(treeId)}" data-branch="yes" onclick="selectBranch('${esc(treeId)}','yes')">
            ${esc(section.branches.yes.label)}
          </button>
          <button type="button" class="decision-btn no" data-tree="${esc(treeId)}" data-branch="no" onclick="selectBranch('${esc(treeId)}','no')">
            ${esc(section.branches.no.label)}
          </button>
        </div>
        <div class="decision-branch" id="${esc(treeId)}-yes">
          ${yesFields}
          <div class="decision-outcome green">${esc(section.branches.yes.outcome)}</div>
        </div>
        <div class="decision-branch" id="${esc(treeId)}-no">
          ${noFields}
          <div class="decision-outcome red">${esc(section.branches.no.outcome)}</div>
        </div>
      </div>`
    }
    return renderSection(section)
  }).join('')
}

function renderFormulationLayout(schema: WorksheetSchema): string {
  // Simplified layout: each section as a labeled block
  return schema.sections.map(section => {
    const domain = section.domain
      ? `<div class="formulation-domain">${esc(section.domain.toUpperCase())}</div>`
      : ''
    const title = section.title
      ? `<div class="section-title">${esc(section.title)}</div>`
      : ''
    const desc = section.description
      ? `<div class="section-description">${esc(section.description)}</div>`
      : ''
    const fields = section.fields.map(renderField).join('')
    return `<div class="section"><div class="formulation-section">${domain}${title}${desc}${fields}</div></div>`
  }).join('')
}

function renderBody(schema: WorksheetSchema): string {
  switch (schema.layout) {
    case 'safety_plan':
      return renderSafetyPlanLayout(schema)
    case 'decision_tree':
      return renderDecisionTreeLayout(schema)
    case 'formulation_cross_sectional':
    case 'formulation_vicious_flower':
    case 'formulation_longitudinal':
      return renderFormulationLayout(schema)
    default:
      return schema.sections.map(renderSection).join('')
  }
}

// ── JavaScript for interactivity ──

function generateJs(schema: WorksheetSchema, storageKey: string): string {
  // Collect table column info for addRow
  const tableFields: { id: string; columns: TableColumn[] }[] = []
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === 'table' || field.type === 'hierarchy') {
        tableFields.push({
          id: field.id,
          columns: (field as TableField).columns,
        })
      }
    }
  }
  const tableColumnsJson = JSON.stringify(
    Object.fromEntries(tableFields.map(t => [t.id, t.columns.map(c => ({ id: c.id, type: c.type, header: c.header }))]))
  )

  return `
(function() {
  var STORAGE_KEY = ${JSON.stringify(storageKey)};
  var TABLE_COLUMNS = ${tableColumnsJson};
  var saveTimer = null;

  // ── Save / Load ──

  function collectData() {
    var data = {};
    document.querySelectorAll('input, textarea, select').forEach(function(el) {
      if (el.type === 'checkbox') {
        if (!data[el.name]) data[el.name] = [];
        if (el.checked) data[el.name].push(el.value);
      } else {
        data[el.id || el.name] = el.value;
      }
    });
    // Save decision tree state
    document.querySelectorAll('.decision-btn.active').forEach(function(btn) {
      data['_tree_' + btn.dataset.tree] = btn.dataset.branch;
    });
    return data;
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
      showSaveIndicator();
    } catch(e) {}
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveData, 500);
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      Object.keys(data).forEach(function(key) {
        if (key.startsWith('_tree_')) {
          var treeId = key.slice(6);
          var branch = data[key];
          selectBranch(treeId, branch);
          return;
        }
        var el = document.getElementById(key);
        if (el) {
          el.value = data[key];
          // Update likert display
          if (el.dataset && el.dataset.likert) {
            var display = document.getElementById(key + '-val');
            if (display) display.textContent = data[key];
          }
        } else {
          // Checklist: multiple checkboxes with same name
          var checkboxes = document.querySelectorAll('input[name="' + key + '"]');
          if (checkboxes.length && Array.isArray(data[key])) {
            checkboxes.forEach(function(cb) {
              cb.checked = data[key].indexOf(cb.value) !== -1;
            });
          }
        }
      });
    } catch(e) {}
  }

  function showSaveIndicator() {
    var indicator = document.getElementById('save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      indicator.classList.add('visible');
      setTimeout(function() { indicator.classList.remove('visible'); }, 2000);
    }
  }

  // ── Likert sliders ──

  document.querySelectorAll('input[type="range"][data-likert]').forEach(function(slider) {
    var display = document.getElementById(slider.id + '-val');
    slider.addEventListener('input', function() {
      if (display) display.textContent = slider.value;
      debouncedSave();
    });
  });

  // ── Table row management ──

  window.addRow = function(tableId) {
    var table = document.querySelector('table[data-table="' + tableId + '"]');
    if (!table) return;
    var maxRows = parseInt(table.dataset.maxRows) || 20;
    var tbody = table.querySelector('tbody');
    var currentRows = tbody.querySelectorAll('tr').length;
    if (currentRows >= maxRows) return;

    var cols = TABLE_COLUMNS[tableId] || [];
    var row = document.createElement('tr');
    row.dataset.row = String(currentRows);

    var numCell = document.createElement('td');
    numCell.className = 'row-num';
    numCell.textContent = String(currentRows + 1);
    row.appendChild(numCell);

    cols.forEach(function(col) {
      var td = document.createElement('td');
      var cellId = tableId + '_r' + currentRows + '_' + col.id;
      var input;
      if (col.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 2;
      } else if (col.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
      } else {
        input = document.createElement('input');
        input.type = 'text';
      }
      input.id = cellId;
      input.name = cellId;
      input.placeholder = col.header;
      input.addEventListener('input', debouncedSave);
      td.appendChild(input);
      row.appendChild(td);
    });

    var removeCell = document.createElement('td');
    removeCell.className = 'row-remove';
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '\\u00d7';
    removeBtn.title = 'Remove row';
    removeBtn.onclick = function() { removeRow(removeBtn); };
    removeCell.appendChild(removeBtn);
    row.appendChild(removeCell);

    tbody.appendChild(row);
    renumberRows(tbody);
    debouncedSave();

    // Hide add button if at max
    if (currentRows + 1 >= maxRows) {
      var btn = document.querySelector('[data-add-for="' + tableId + '"]');
      if (btn) btn.style.display = 'none';
    }
  };

  window.removeRow = function(btn) {
    var row = btn.closest('tr');
    var tbody = row.closest('tbody');
    var table = row.closest('table');
    var minRows = parseInt(table.dataset.minRows) || 1;
    if (tbody.querySelectorAll('tr').length <= minRows) return;
    row.remove();
    renumberRows(tbody);
    debouncedSave();

    // Show add button again
    var tableId = table.dataset.table;
    var addBtn = document.querySelector('[data-add-for="' + tableId + '"]');
    if (addBtn) addBtn.style.display = '';
  };

  function renumberRows(tbody) {
    tbody.querySelectorAll('tr').forEach(function(row, i) {
      var numCell = row.querySelector('.row-num');
      if (numCell) numCell.textContent = String(i + 1);
    });
  }

  // ── Decision tree ──

  window.selectBranch = function(treeId, branch) {
    // Toggle buttons
    document.querySelectorAll('[data-tree="' + treeId + '"]').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.branch === branch);
    });
    // Show/hide branches
    var yesBranch = document.getElementById(treeId + '-yes');
    var noBranch = document.getElementById(treeId + '-no');
    if (yesBranch) yesBranch.classList.toggle('visible', branch === 'yes');
    if (noBranch) noBranch.classList.toggle('visible', branch === 'no');
    debouncedSave();
  };

  // ── Auto-save on all inputs ──

  document.querySelectorAll('input:not([type="range"]), textarea, select').forEach(function(el) {
    el.addEventListener('input', debouncedSave);
    el.addEventListener('change', debouncedSave);
  });

  // ── Load saved data on init ──
  loadData();
})();
`
}

// ── Main export ──

export function generateInteractiveHtml(
  schema: WorksheetSchema,
  title: string,
  description?: string,
  instructions?: string,
): string {
  const storageKey = `formulate_${sanitize(title)}`
  const css = generateCss()
  const body = renderBody(schema)
  const js = generateJs(schema, storageKey)

  const descHtml = description
    ? `<p class="worksheet-description">${esc(description)}</p>`
    : ''
  const instructHtml = instructions
    ? `<div class="worksheet-instructions">${esc(instructions)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Formulate</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <div class="container header-inner">
      <span class="logo-icon">${LOGO_SVG}</span>
      <span class="logo-text">Formulate</span>
    </div>
  </header>

  <main class="container">
    <h1 class="worksheet-title">${esc(title)}</h1>
    ${descHtml}
    ${instructHtml}
    ${body}
  </main>

  <footer>
    <div class="container">
      <div class="footer-brand">
        ${LOGO_SVG}
        <span>Powered by Formulate</span>
      </div>
    </div>
  </footer>

  <div id="save-indicator" class="save-indicator">Saved</div>

  <script>${js}</script>
</body>
</html>`
}

/** Download the interactive HTML worksheet as a file */
export function downloadInteractiveHtml(
  schema: WorksheetSchema,
  title: string,
  description?: string,
  instructions?: string,
): void {
  const html = generateInteractiveHtml(schema, title, description, instructions)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(title)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
