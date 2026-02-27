// Prompt builder for AI text-to-worksheet generation
// Therapist describes a worksheet in natural language → Claude generates a complete JSONB schema

const FIELD_TYPES_REFERENCE = `## Available Field Types

Each field MUST have a unique "id" (kebab-case, e.g. "f-1", "situation", "belief-before"), a "label" (non-empty), and "type" from this list:

1. "text" — Single-line text input
   { "id": "...", "type": "text", "label": "...", "placeholder": "..." }

2. "textarea" — Multi-line text area (the most common type — use for open-ended clinical prompts)
   { "id": "...", "type": "textarea", "label": "...", "placeholder": "..." }

3. "number" — Numeric input with optional range
   { "id": "...", "type": "number", "label": "...", "min": 0, "max": 100, "step": 1 }

4. "likert" — Visual slider scale with anchors (preferred over bare number for subjective ratings)
   { "id": "...", "type": "likert", "label": "...", "min": 0, "max": 100, "step": 5, "anchors": { "0": "Not at all", "50": "Moderate", "100": "Extreme" } }

5. "checklist" — Multiple selection (tick all that apply)
   { "id": "...", "type": "checklist", "label": "...", "options": [{ "id": "opt-1", "label": "..." }] }

6. "select" — Single-choice dropdown
   { "id": "...", "type": "select", "label": "...", "options": [{ "id": "opt-1", "label": "..." }] }

7. "date" — Date picker
   { "id": "...", "type": "date", "label": "..." }

8. "time" — Time picker
   { "id": "...", "type": "time", "label": "..." }

9. "table" — Dynamic multi-row data table
   { "id": "...", "type": "table", "label": "...", "columns": [{ "id": "col-1", "header": "...", "type": "text" }, { "id": "col-2", "header": "...", "type": "number", "min": 0, "max": 100, "suffix": "%" }], "min_rows": 1, "max_rows": 10 }
   Column types: "text", "textarea", or "number" only.

10. "computed" — Auto-calculated display (not an input)
    { "id": "...", "type": "computed", "label": "Average score", "computation": { "operation": "average", "field": "table-id.column-id" } }
    Operations: "sum", "average", "count", "difference", "percentage_change"
    For sum/average/count: use "field" (e.g. "my-table.rating-col")
    For difference/percentage_change: use "field_a" and "field_b"

11. "record" — Paginated multi-column cards (for thought records, behavioural experiments)
    One record per worksheet. Each entry fills a full card with multiple "groups" (columns).
    Groups can contain compound sub-fields (e.g. textarea + likert slider in one column).
    { "id": "...", "type": "record", "label": "...", "min_records": 1, "max_records": 10,
      "groups": [
        { "id": "situation", "header": "Situation", "width": "normal",
          "fields": [{ "id": "desc", "type": "textarea", "placeholder": "..." }]
        },
        { "id": "emotion", "header": "Emotion", "width": "narrow",
          "fields": [
            { "id": "name", "type": "text", "placeholder": "e.g. Anxious" },
            { "id": "intensity", "type": "likert", "label": "Intensity", "min": 0, "max": 100, "step": 5 }
          ]
        }
      ]
    }
    Group sub-field types: "text", "textarea", "number", "likert", "checklist", "select"
    Group widths: "narrow" (0.7fr), "normal" (1fr), "wide" (1.5fr)

12. "formulation" — Spatial clinical diagram with nodes and connections
    One formulation per worksheet. Used for CBT maintenance models, developmental models, etc.
    { "id": "...", "type": "formulation", "label": "...",
      "layout": "cross_sectional",
      "formulation_config": { "title": "...", "show_title": true },
      "nodes": [
        { "id": "trigger", "slot": "top", "label": "Trigger", "domain_colour": "#64748b",
          "fields": [{ "id": "text", "type": "textarea", "placeholder": "..." }]
        }
      ],
      "connections": [
        { "from": "trigger", "to": "thoughts", "style": "arrow", "direction": "one_way" }
      ]
    }
    See FORMULATION PATTERNS below for layout details.`

const FORMULATION_PATTERNS = `## Formulation Layout Patterns

Only generate formulations when the description clearly calls for one (mentions "formulation", "model", "cycle", "five areas", "hot cross bun", "vicious flower", "maintenance", "three systems", "CFT", "longitudinal", "developmental", or a specific disorder model).

### "cross_sectional" — Five Areas / Hot Cross Bun
5 fixed nodes: top, left, centre, right, bottom.
Default domains: Situation (top), Thoughts (left), Emotions (centre), Physical (right), Behaviour (bottom).
Connections: top → middle three (one_way), middle three ↔ each other (both), middle three → bottom (one_way).
Use for: generic CBT 5 areas, health anxiety, social anxiety, panic, depression, any disorder-specific maintenance model.

Node slots and their positions:
- "top" — trigger/situation
- "left" — typically thoughts/cognitions
- "centre" — typically emotions
- "right" — typically physical/body
- "bottom" — typically behaviour/response

### "radial" — Vicious Flower / Maintenance Factors
1 centre node + 3-8 petals arranged in a circle.
Centre = core problem. Petals = maintaining factors.
Connections: each petal → centre (arrow_dashed, one_way).
Use for: OCD vicious flower, any "central problem with maintaining factors" model.

Node slots:
- "centre" — core problem
- "petal-0", "petal-1", "petal-2", etc. — maintaining factors

### "vertical_flow" — Longitudinal / Developmental
2-8 sequential steps flowing top to bottom, with optional 2×2 sub-grid at the bottom.
Connections: downward arrows between consecutive steps. Sub-grid nodes have bidirectional internal connections.
Use for: longitudinal/developmental formulation, Beckian CBT model, any sequential "how did we get here" formulation, Ehlers & Clark PTSD.

Node slots:
- "step-0", "step-1", "step-2", etc. — sequential developmental stages
- "grid-0", "grid-1", "grid-2", "grid-3" — optional 2×2 sub-grid at bottom (e.g. for thoughts/emotions/physical/behaviour breakdown)

Typical step labels: Early Experiences → Core Beliefs → Rules & Assumptions → Critical Incident → [sub-grid with maintaining factors]

### "cycle" — Maintenance Cycle / Loop
3-6 nodes arranged in a clockwise circular loop.
Connections: unidirectional arrows forming a clockwise cycle (each node → next, last → first).
Use for: panic cycle, OCD cycle, insomnia maintenance cycle, any circular maintaining loop more specific than the hot cross bun.

Node slots:
- "cycle-0", "cycle-1", "cycle-2", etc. — stages in the clockwise loop

### "three_systems" — Triangle / Three Circles
3 nodes in a triangle arrangement (apex + two base), with an optional centre node.
Connections: bidirectional arrows between all three systems. Optional inhibitory connections (dashed with flat end).
Use for: CFT three systems (threat/drive/soothing), any triangular relationship model, systemic triangulation.

Node slots:
- "system-0" — apex (top centre)
- "system-1" — base left
- "system-2" — base right
- "centre" — optional centre node (e.g. "self" in CFT)

### Domain Colour Palette
Use these standard clinical colours:
- Situation/Trigger: "#64748b" (slate)
- Thoughts/Cognitions: "#2563eb" (blue)
- Emotions/Feelings: "#dc2626" (red)
- Physical/Body: "#16a34a" (green)
- Behaviour/Actions: "#9333ea" (purple)
- Reassurance: "#e4a930" (amber)
- Core beliefs: "#92400e" (brown)
- Relationships: "#db2777" (pink)
- Neutral/Other: "#6b7280" (grey)

### Connection Styles
- "arrow" — solid arrow (causal relationship)
- "arrow_dashed" — dashed arrow (maintaining/feedback)
- "line" — solid line (association)
- "line_dashed" — dashed line (weak/hypothesised)
- "inhibitory" — dashed with flat bar end (inhibitory, used in CFT)

### Connection Direction
- "one_way" — from → to
- "both" — bidirectional
- "none" — no arrowheads`

const CLINICAL_RULES = `## Clinical Accuracy Rules

1. Use the correct clinical model for the disorder:
   - Health anxiety → Salkovskis & Warwick maintenance model
   - Panic → Clark (1986) catastrophic misinterpretation
   - Social anxiety → Clark & Wells
   - GAD → Wells metacognitive model / Dugas intolerance of uncertainty
   - OCD → Salkovskis (1985) / Rachman
   - PTSD → Ehlers & Clark (2000)
   - Depression → Beck
   - Eating disorders → Fairburn CBT-E
   - CFT → Gilbert three systems
   - Psychosis → Morrison CBTp
   - Insomnia → Espie / Harvey
   - Chronic pain → Vlaeyen & Linton fear-avoidance

2. British English throughout: "behaviour", "formulation", "organisation", "recognise"

3. Placeholders should be realistic clinical examples, not generic "enter your response" text.
   Good: "e.g. Noticed heart racing while sitting at desk"
   Bad: "Enter the triggering situation here"

4. SUDS = Subjective Units of Distress Scale (0-100)

5. For homework tools: optimise for mobile — avoid wide tables (>4 columns), use generous textareas

6. For formulations: include an instruction section before ("Complete this collaboratively in session") and a reflection section after ("Treatment implications")`

const DECISION_LOGIC = `## Decision Logic

1. Description mentions "formulation", "model", "five areas", "hot cross bun", "maintenance", "vicious flower/cycle", "three systems", "CFT circles", "longitudinal", "developmental", or a specific disorder model → generate a FORMULATION field type. Choose the best layout:
   - cross_sectional → five areas, hot cross bun, disorder-specific maintenance models
   - radial → vicious flower, central problem with maintaining factors
   - vertical_flow → longitudinal/developmental formulation, Beckian model, Ehlers & Clark PTSD
   - cycle → panic cycle, OCD cycle, insomnia cycle, any clockwise maintaining loop
   - three_systems → CFT three systems, any triangular interaction model

2. Description mentions "thought record" with compound columns (text + belief rating in same column) → generate a RECORD field type

3. Description mentions "diary", "log", "schedule", "simple thought record" → generate a TABLE field

4. Description mentions "hierarchy", "graded", "exposure ladder" → generate a TABLE with a number column for SUDS rating, sorted conceptually

5. Description mentions "plan", "safety" → generate a structured multi-section worksheet

6. If ambiguous → default to a linear worksheet with textarea fields

7. If description mentions a disorder but not a specific tool → generate the most commonly used tool:
   - "OCD" → ERP hierarchy (table) or OCD cycle formulation (cycle)
   - "depression" → behavioural activation schedule (table)
   - "panic" → panic cycle maintenance formulation (cycle)
   - "health anxiety" → health anxiety maintenance formulation (cross_sectional)
   - "social anxiety" → social situation record
   - "GAD" → worry log (table)
   - "CFT" or "compassion focused" → three systems formulation (three_systems)
   - "PTSD" → Ehlers & Clark longitudinal formulation (vertical_flow)
   - "insomnia" → sleep maintenance cycle (cycle)

8. Always include at least one computed field where clinically meaningful

9. For formulations: ALWAYS structure as 3 sections:
   Section 1: Introduction (instruction text)
   Section 2: Formulation (the formulation field)
   Section 3: Reflection (textarea for treatment implications + optional computed fields)

10. Maximum one formulation per worksheet, maximum one record per worksheet`

const OUTPUT_FORMAT = `## Output Format

Return a SINGLE JSON object with NO markdown fences, ONLY raw JSON:

{
  "meta": {
    "title": "Worksheet title",
    "slug": "url-friendly-slug",
    "description": "1-2 sentence clinical description",
    "instructions": "2-3 sentences on how to use this tool",
    "tags": ["tag1", "tag2", "tag3"],
    "estimated_minutes": 15,
    "confidence": "HIGH",
    "interpretation": "Brief note on what you generated and why"
  },
  "schema": {
    "version": 1,
    "sections": [
      {
        "id": "s-1",
        "title": "Section Title",
        "description": "Optional section description",
        "fields": [ /* field objects */ ]
      }
    ]
  }
}

RULES:
1. ONLY output valid JSON. No markdown, no explanation.
2. Section IDs: use meaningful kebab-case ("context", "formulation", "reflection") not "s-1"
3. Field IDs: use meaningful kebab-case ("situation", "belief-before", "emotion-intensity") not "f-1"
4. Every field MUST have a non-empty "label" (except formulation sub-fields where label is optional)
5. Likert scales MUST have anchors for min and max values
6. Tables: at least 2 columns, min_rows: 1
7. Tags: include therapy type, technique, disorder
8. confidence: HIGH if clear request, MEDIUM if some inference needed, LOW if very ambiguous
9. Do NOT include personally identifiable information in any field
10. Conditional visibility: sections or fields can have an optional "show_when" rule that hides them until a condition is met. Useful for risk escalation, branching, and progressive disclosure.
   Format: "show_when": { "field": "source-field-id", "operator": "equals|not_equals|greater_than|less_than|not_empty|empty|contains", "value": ... }
   Example: A safety plan section that only appears when risk rating > 7:
   { "id": "safety-plan", "title": "Safety Plan", "show_when": { "field": "risk-rating", "operator": "greater_than", "value": 7 }, "fields": [...] }
   Use sparingly — only when clinically meaningful (e.g. risk escalation, branching based on symptom severity).`

export function buildGeneratePrompt(description: string): string {
  return `You are a clinical psychology worksheet generator for Formulate, a UK-based CBT worksheet platform for therapists. Generate a complete worksheet schema from the therapist's natural language description.

${FIELD_TYPES_REFERENCE}

${FORMULATION_PATTERNS}

${CLINICAL_RULES}

${DECISION_LOGIC}

${OUTPUT_FORMAT}

## Therapist's Description

"${description}"`
}

export function buildGeneratePromptWithContext(
  description: string,
  context: {
    presentation?: string
    stage?: string
    previousWorksheets?: string[]
  }
): string {
  const contextBlock = [
    context.presentation && `- Primary presentation: ${context.presentation}`,
    context.stage && `- Treatment stage: ${context.stage}`,
    context.previousWorksheets?.length &&
      `- Previously used worksheets: ${context.previousWorksheets.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `You are a clinical psychology worksheet generator for Formulate, a UK-based CBT worksheet platform for therapists. Generate a complete worksheet schema from the therapist's natural language description.

${FIELD_TYPES_REFERENCE}

${FORMULATION_PATTERNS}

${CLINICAL_RULES}

${DECISION_LOGIC}

${OUTPUT_FORMAT}

## Client Context (use to tailor the worksheet — do NOT include identifiable information)

${contextBlock || 'No additional context provided.'}

## Therapist's Description

"${description}"`
}
