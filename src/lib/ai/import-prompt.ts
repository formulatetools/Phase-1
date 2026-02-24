// Prompt builder for AI-powered worksheet import
// Sends extracted document text to Claude Haiku 4.5 and gets back a WorksheetSchema

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

## Allowed Field Types

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

## Rules

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

## Document to Convert

"""
${documentText}
"""`
}
