// Prompt builder for AI-powered worksheet import
// Sends extracted document text to Claude Haiku 4.5 and gets back a WorksheetSchema
// Supports two modes: blank template (schema only) and filled worksheet (schema + response values)

const SCHEMA_SPEC = `## Allowed Field Types

Each field MUST have "id" (unique, format "f-1", "f-2", etc.), "label" (non-empty string), and "type" from this list ONLY:

1. "text" — Single-line text input
   { "id": "f-1", "type": "text", "label": "...", "placeholder": "..." }

2. "textarea" — Multi-line text area
   { "id": "f-2", "type": "textarea", "label": "...", "placeholder": "..." }

3. "number" — Numeric input with optional range
   { "id": "f-3", "type": "number", "label": "...", "min": 0, "max": 100, "step": 1 }

4. "likert" — Rating scale with anchors
   { "id": "f-4", "type": "likert", "label": "...", "min": 0, "max": 10, "step": 1, "anchors": { "0": "Not at all", "10": "Extremely" } }

5. "checklist" — Multiple selection (tick all that apply)
   { "id": "f-5", "type": "checklist", "label": "...", "options": [{ "id": "opt-1", "label": "..." }, { "id": "opt-2", "label": "..." }] }

6. "date" — Date picker
   { "id": "f-6", "type": "date", "label": "..." }

7. "time" — Time picker
   { "id": "f-7", "type": "time", "label": "..." }

8. "select" — Single-choice dropdown (pick one)
   { "id": "f-8", "type": "select", "label": "...", "options": [{ "id": "opt-1", "label": "..." }] }

9. "table" — Dynamic rows with typed columns
   { "id": "f-9", "type": "table", "label": "...", "columns": [{ "id": "col-1", "header": "...", "type": "text" }, { "id": "col-2", "header": "...", "type": "number", "min": 0, "max": 100 }], "min_rows": 1, "max_rows": 10 }
   Column types can ONLY be: "text", "textarea", or "number"

10. "computed" — Auto-calculated from other fields
    { "id": "f-10", "type": "computed", "label": "Total Score", "computation": { "operation": "sum", "fields": ["f-3", "f-4"] } }
    Operations: "sum", "average", "count", "min", "max", "difference", "percentage_change"
    For "difference"/"percentage_change": use "field_a" and "field_b" instead of "fields"

11. "formulation" — Spatial clinical diagram with nodes and connections
    Used for CBT models, maintenance formulations, five areas, vicious cycles, longitudinal/developmental formulations.
    { "id": "formulation", "type": "formulation", "label": "Formulation",
      "layout": "cross_sectional",
      "formulation_config": { "title": "...", "show_title": true },
      "nodes": [
        { "id": "trigger", "slot": "top", "label": "Trigger", "domain_colour": "#64748b",
          "fields": [{ "id": "text", "type": "textarea", "placeholder": "..." }] }
      ],
      "connections": [
        { "from": "trigger", "to": "thoughts", "style": "arrow", "direction": "one_way" }
      ]
    }
    Layout patterns: "cross_sectional" (5 areas diamond: top, left, centre, right, bottom), "radial" (centre + petals: centre, petal-0, petal-1...), "vertical_flow" (sequential steps: step-0, step-1...), "cycle" (clockwise loop: cycle-0, cycle-1...), "three_systems" (triangle: system-0, system-1, system-2, optional centre).
    Domain colours: Situation "#64748b", Thoughts "#2563eb", Emotions "#dc2626", Physical "#16a34a", Behaviour "#9333ea", Reassurance "#e4a930", Core beliefs "#92400e".
    Connection styles: "arrow" (solid), "arrow_dashed" (dashed). Direction: "one_way" or "both".

## Field Selection Guidelines

- Free-text prompts ("Describe...", "What thoughts...") → textarea
- Short answers (name, single word) → text
- Rating scales (0-10, 1-5, "not at all" to "extremely") → likert with anchors
- Multiple-choice tick-all-that-apply → checklist
- Multiple-choice pick-one → select
- Tabular/columnar data (thought records, activity logs, rows of entries) → table
- Dates → date
- Times → time
- Scores that sum or average other fields → computed
- Diagrams with labelled nodes/boxes connected by arrows (five areas, hot cross bun, maintenance cycle, vicious flower, longitudinal formulation, developmental model, three systems/CFT) → formulation`

const SCHEMA_RULES = `## Rules

1. ONLY output valid JSON. No markdown, no explanation, just the JSON object.
2. ONLY use the 10 field types listed above. Never invent new types.
3. Section IDs must be unique: "s-1", "s-2", etc.
4. Field IDs must be globally unique across all sections: "f-1", "f-2", etc.
5. Every field MUST have a non-empty "label".
6. Preserve the clinical intent and structure of the original worksheet.
7. If the document has no clear sections, create a single section with an empty title.
8. For Likert scales, always include anchors for the min and max values.
9. For tables, include at least 2 columns and set min_rows: 1, max_rows: 10.
10. For tags, suggest relevant clinical tags like "CBT", "anxiety", "depression", "thought record", etc.
11. If the document contains any personally identifiable information (names, emails, phone numbers, addresses, NHS numbers, etc.), do NOT include it in the output. Use generic placeholders in labels if needed.
12. FORMULATION DETECTION: If the document contains a clinical diagram/model with labelled nodes or boxes connected by arrows, convert it to a "formulation" field type. Recognition signals:
    - Boxes/circles labelled with CBT domains (Thoughts, Emotions, Physical Sensations, Behaviour, Situation/Trigger)
    - Arrow connections between labelled sections (→, ↔, bidirectional)
    - "Five areas" / "Hot cross bun" / "CBT model" / "Maintenance model" → layout: "cross_sectional"
    - "Vicious flower" / central problem with maintaining factors → layout: "radial"
    - "Longitudinal" / "Developmental" / early experiences → core beliefs → assumptions chain → layout: "vertical_flow"
    - "Cycle" / "Maintenance cycle" / "Panic cycle" / clockwise loop → layout: "cycle"
    - "Three systems" / "CFT" / "Compassion focused" / threat/drive/soothing → layout: "three_systems"
    When generating a formulation, wrap it in 3 sections: context/instructions before, formulation field, and reflection/implications after.`

export function buildImportPrompt(documentText: string): string {
  return `You are a clinical psychology worksheet digitiser. Convert the paper-based therapy worksheet below into a structured JSON schema for an interactive web form.

## Output Format

Return a single JSON object with this exact structure (NO markdown fences, ONLY raw JSON):

{
  "title": "Worksheet title",
  "description": "1-2 sentence clinical description of what this worksheet is for",
  "instructions": "Instructions shown to the user before they fill it in",
  "estimatedMinutes": 15,
  "tags": ["tag1", "tag2"],
  "schema": {
    "version": 1,
    "sections": [
      {
        "id": "s-1",
        "title": "Section Title",
        "description": "Optional section instructions",
        "fields": [ /* field objects */ ]
      }
    ]
  }
}

${SCHEMA_SPEC}

${SCHEMA_RULES}

## Document to Convert

"""
${documentText}
"""`
}

export function buildFilledImportPrompt(documentText: string): string {
  return `You are a clinical psychology worksheet digitiser. The document below is a FILLED-IN therapy worksheet — it contains both the worksheet structure AND a client's responses. Your job is to extract BOTH the worksheet schema (structure) AND the filled-in response values.

## Output Format

Return a single JSON object with this exact structure (NO markdown fences, ONLY raw JSON):

{
  "title": "Worksheet title",
  "description": "1-2 sentence clinical description of what this worksheet is for",
  "instructions": "Instructions shown to the user before they fill it in",
  "estimatedMinutes": 15,
  "tags": ["tag1", "tag2"],
  "schema": {
    "version": 1,
    "sections": [
      {
        "id": "s-1",
        "title": "Section Title",
        "fields": [ /* field objects with "id", "type", "label", etc. */ ]
      }
    ]
  },
  "responseValues": {
    "f-1": "The client's written answer for this text/textarea field",
    "f-2": 7,
    "f-3": ["opt-1", "opt-3"],
    "f-4": [
      { "col-1": "Row 1 text", "col-2": 85 },
      { "col-1": "Row 2 text", "col-2": 40 }
    ]
  }
}

## The "responseValues" Object

This maps field IDs to the client's actual answers extracted from the document:

- "text" / "textarea" fields → string value (the client's written response)
- "number" fields → number value
- "likert" fields → number value (the rating they selected)
- "checklist" fields → array of selected option IDs, e.g. ["opt-1", "opt-3"]
- "select" fields → single option ID string, e.g. "opt-2"
- "date" fields → date string in "YYYY-MM-DD" format
- "time" fields → time string in "HH:MM" format
- "table" fields → array of row objects, each mapping column IDs to values, e.g. [{ "col-1": "text", "col-2": 50 }]
- "computed" fields → omit from responseValues (they are auto-calculated)

If a field appears blank or unanswered in the document, OMIT it from responseValues entirely.

${SCHEMA_SPEC}

${SCHEMA_RULES}

11. Extract ALL filled-in client responses you can find in the document.
12. Map each response to the correct field ID in responseValues.
13. For checklist fields, only include option IDs that were ticked/selected.
14. For table fields, include one object per filled row.
15. If you cannot determine the value for a field, omit it from responseValues.
16. PRIVACY: The document text has been pre-processed to replace identifiable information with placeholders like [EMAIL], [PHONE], [NAME], [DATE], [NHS_NUMBER], [NI_NUMBER], [POSTCODE]. Keep these placeholders as-is in your responseValues. If you spot any remaining personally identifiable information that was NOT caught by pre-processing, replace it with the appropriate placeholder.

## Filled Worksheet to Convert

"""
${documentText}
"""`
}
