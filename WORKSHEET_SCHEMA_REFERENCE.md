# Formulate — Worksheet Schema Reference

> This document is a comprehensive reference for generating new worksheet templates. It contains the full field type specification, the database row shape, all existing worksheets, and annotated schema examples.

---

## Table of Contents
1. [Database Row Shape](#1-database-row-shape)
2. [Schema Envelope](#2-schema-envelope)
3. [Sections](#3-sections)
4. [Field Types — Full Specification](#4-field-types--full-specification)
5. [Computed Field Reference Syntax](#5-computed-field-reference-syntax)
6. [Special Layouts](#6-special-layouts)
7. [Existing Worksheets (All 34)](#7-existing-worksheets-all-34)
8. [Complete Schema Examples](#8-complete-schema-examples)
9. [Rules and Conventions](#9-rules-and-conventions)

---

## 1. Database Row Shape

Each worksheet is a row in the `worksheets` table:

```typescript
interface Worksheet {
  id: string                           // UUID, auto-generated
  category_id: string | null           // FK to categories table
  title: string                        // Display title
  slug: string                         // URL-safe slug (kebab-case)
  description: string                  // Short summary for cards/listings
  instructions: string                 // Shown at top of worksheet when filling in
  schema: WorksheetSchema              // JSONB — the full schema (see below)
  is_published: boolean                // Visible to users
  is_premium: boolean                  // Requires paid plan
  tags: string[]                       // Searchable tags (Postgres text[])
  estimated_minutes: number | null     // Estimated completion time
  display_order: number                // Sort order within category
  is_curated: boolean                  // true = platform-provided, false = user-created
  visibility: 'private' | 'unlisted' | 'submitted' | 'published'
  created_by: string | null            // therapist user ID (null for curated)
  schema_version: number               // Schema format version
}
```

### Categories (with UUIDs for SQL inserts)

| UUID | Name | Slug | Icon |
|------|------|------|------|
| `46b771b7-fd91-4e31-9ad9-4481ed516c28` | General CBT Skills | `general-cbt-skills` | `brain` |
| `0fa9fd47-7185-471f-a096-870c9231f843` | Depression | `depression` | `cloud-rain` |
| `7595b42f-c4aa-467b-8588-1c62e160008a` | Generalised Anxiety (GAD) | `generalised-anxiety-gad` | `alert-circle` |
| `07036cf2-914a-4bd8-b0bc-066a69ef1c8c` | Obsessive-Compulsive Disorder (OCD) | `obsessive-compulsive-disorder-ocd` | `refresh-cw` |
| — | Social Anxiety | `social-anxiety` | `users` |
| — | Health Anxiety | `health-anxiety` | `activity` |
| — | Panic Disorder | `panic-disorder` | `zap` |
| — | PTSD / Trauma | `ptsd-trauma` | `shield` |
| — | Low Self-Esteem | `low-self-esteem` | `message-circle` |

---

## 2. Schema Envelope

```typescript
interface WorksheetSchema {
  version: number          // Always 1
  layout?: SchemaLayout    // Only for special visual layouts (see §6)
  sections: WorksheetSection[]
}
```

`layout` is **optional**. Only set it for formulation diagrams, decision trees, or safety plans. Regular worksheets omit it entirely.

Valid `SchemaLayout` values:
- `"formulation_cross_sectional"` — Hot cross bun / 5-area model
- `"formulation_vicious_flower"` — Central problem with radial petals
- `"formulation_longitudinal"` — Vertical Beckian developmental flow
- `"decision_tree"` — Branching yes/no flow
- `"safety_plan"` — Numbered sequential steps

---

## 3. Sections

```typescript
interface WorksheetSection {
  id: string                // Unique within schema (kebab-case)
  title?: string            // Displayed section heading
  description?: string      // Subtitle/instruction for this section
  fields: WorksheetField[]  // The input fields (see §4)

  // Optional modifiers:
  domain?: DomainType       // Colour-coding for formulations
  highlight?: 'amber' | 'red_dashed' | 'red'  // Visual emphasis
  layout?: 'four_quadrant'  // 2x2 grid layout within this section
  step?: number             // For safety_plan layout
  label?: string            // For safety_plan step labels
  hint?: string             // For safety_plan step hints

  // For vicious flower dynamic petals:
  dynamic?: boolean
  min_items?: number
  max_items?: number
  item_template?: { fields: { id: string; type: string; label: string; placeholder?: string }[] }
  default_items?: { petal_label: string; domain: DomainType }[]

  // For decision tree branch sections:
  type?: 'branch'
  question?: string
  branches?: {
    yes: { label: string; colour: 'green' | 'red'; fields?: []; outcome: string }
    no:  { label: string; colour: 'green' | 'red'; fields?: []; outcome: string }
  }
}
```

`DomainType` values: `'situation'` | `'thoughts'` | `'emotions'` | `'physical'` | `'behaviour'` | `'reassurance'` | `'attention'`

---

## 4. Field Types — Full Specification

### 4.1 `text` — Single-line text input

```typescript
{
  id: string,
  type: "text",
  label: string,
  required?: boolean,
  placeholder?: string
}
```

**Use for:** Short responses — emotion names, labels, single-word answers.

### 4.2 `textarea` — Multi-line text input

```typescript
{
  id: string,
  type: "textarea",
  label: string,
  required?: boolean,
  placeholder?: string
}
```

**Use for:** Open-ended reflections, descriptions, narratives. The most common field type.

### 4.3 `number` — Numeric input

```typescript
{
  id: string,
  type: "number",
  label: string,
  required?: boolean,
  placeholder?: string,
  min?: number,
  max?: number,
  step?: number
}
```

**Use for:** Ratings, scores, counts. Prefer `likert` for 0-100 or 0-10 scales that benefit from a visual slider.

### 4.4 `likert` — Slider scale

```typescript
{
  id: string,
  type: "likert",
  label: string,
  required?: boolean,
  min: number,        // Required
  max: number,        // Required
  step?: number,      // Default 1
  anchors?: {         // Labels at key points
    [value: string]: string   // e.g. {"0": "None", "50": "Moderate", "100": "Extreme"}
  }
}
```

**Use for:** Subjective ratings — emotion intensity, belief strength, mood, SUDS, confidence.
**Common scales:** `0–100` (percentages), `0–10` (mood/mastery/pleasure).

### 4.5 `checklist` — Multi-select checkboxes

```typescript
{
  id: string,
  type: "checklist",
  label: string,
  required?: boolean,
  options: [
    { id: string, label: string },  // Each option
    ...
  ]
}
```

**Use for:** Coping strategies, cognitive distortions, symptom checklists.
**Value shape:** `string[]` of selected option IDs.

### 4.6 `select` — Single-select dropdown

```typescript
{
  id: string,
  type: "select",
  label: string,
  required?: boolean,
  placeholder?: string,
  options: [
    { id: string, label: string },
    ...
  ]
}
```

**Use for:** Choosing one option from a fixed list — day of week, category, severity level.

### 4.7 `date` — Date picker

```typescript
{
  id: string,
  type: "date",
  label: string,
  required?: boolean
}
```

**Use for:** Date of event, session date.

### 4.8 `time` — Time picker

```typescript
{
  id: string,
  type: "time",
  label: string,
  required?: boolean
}
```

**Use for:** Time of panic attack, sleep/wake times.

### 4.9 `table` — Multi-row data table

```typescript
{
  id: string,
  type: "table",
  label: string,
  columns: [
    {
      id: string,
      header: string,                // Column header text
      type: "text" | "textarea" | "number",
      min?: number,                  // For number columns
      max?: number,
      step?: number,
      suffix?: string,               // e.g. "%" shown after value
      width?: "narrow" | "normal" | "wide"
    },
    ...
  ],
  min_rows?: number,    // Default 1
  max_rows?: number,    // Default 10
  group_by?: string     // Optional column ID for grouping rows
}
```

**Use for:** Repeated structured entries — thought records, activity logs, exposure lists.
**Value shape:** `Array<Record<columnId, value>>` — an array of row objects.

### 4.10 `hierarchy` — Sorted list with gradient bars

```typescript
{
  id: string,
  type: "hierarchy",
  label: string,
  columns: [
    { id: string, header: string, type: "text" | "textarea" | "number", ... }
  ],
  sort_by?: string,                 // Column ID to sort by
  sort_direction?: "asc" | "desc",  // Default "desc"
  min_rows?: number,
  max_rows?: number,
  visualisation?: "gradient_bar",   // Visual bar next to each row
  gradient?: {
    low: string,    // Hex colour for low values
    mid: string,    // Hex colour for mid values
    high: string    // Hex colour for high values
  }
}
```

**Use for:** ERP exposure hierarchies, fear ladders, graded task lists.
**Note:** This is a curated-only type — not available in the custom builder.

### 4.11 `computed` — Auto-calculated value

```typescript
{
  id: string,
  type: "computed",
  label: string,
  computation: {
    operation: "difference" | "average" | "count" | "sum" | "min" | "max" | "percentage_change",
    field?: string,         // For average/sum/count/min/max: "tableId.columnId"
    field_a?: string,       // For difference: before field
    field_b?: string,       // For difference: after field
    fields?: string[],      // Multiple source field IDs
    format?: "percentage_change" | "number" | "integer",
    group_by?: string       // Column ID for grouped aggregation
  }
}
```

**Use for:** Automatic summaries — average ratings, belief change, item counts.
**Not an input** — renders as a read-only calculated badge.

**Reference syntax** (see §5 for details):
- `"fieldId"` → single top-level value
- `"tableId.columnId"` → all row values for that column
- `"recordId.groupId.fieldId"` → values from all records for that group/field

### 4.12 `safety_plan` — Numbered sequential steps

```typescript
{
  id: string,
  type: "safety_plan",
  label: string,
  steps: [
    {
      id: string,
      step: number,       // Step number (1-based)
      label: string,      // Step title
      hint?: string,      // Helper text
      highlight?: "red",  // Visual emphasis for critical steps
      fields: [{ id: string, type: "textarea", placeholder?: string }]
    },
    ...
  ]
}
```

**Use for:** Crisis safety plans. Curated-only type.

### 4.13 `decision_tree` — Branching yes/no flow

```typescript
{
  id: string,
  type: "decision_tree",
  label: string,
  question: string,
  branches: {
    yes: {
      label: string,
      colour: "green" | "red",
      fields?: [{ id: string, type: "text" | "textarea", label: string, placeholder?: string }],
      outcome: string    // Text shown at the end of this branch
    },
    no: {
      label: string,
      colour: "green" | "red",
      outcome: string
    }
  }
}
```

**Use for:** Worry trees, decision frameworks. Curated-only type.

### 4.14 `formulation` — Spatial/diagrammatic layouts

```typescript
{
  id: string,
  type: "formulation",
  label: string,
  layout: FormulationLayoutPattern,  // See below

  // New generalised format (for custom formulations):
  formulation_config?: {
    title?: string,
    show_title?: boolean,
    background?: string
  },
  nodes?: FormulationNode[],         // See below
  connections?: FormulationConnection[],

  // Legacy curated format:
  dynamic?: boolean,
  domain?: DomainType,
  highlight?: "amber" | "red_dashed",
  min_items?: number,
  max_items?: number,
  item_template?: { fields: [...] },
  default_items?: { petal_label: string, domain: DomainType }[]
}
```

**Layout patterns:**
- `"cross_sectional"` — 5-area hot cross bun
- `"radial"` — Central node with surrounding petals
- `"vertical_flow"` — Top-to-bottom flow
- `"cycle"` — Circular maintenance cycle
- `"three_systems"` — Three interconnected systems

**FormulationNode:**
```typescript
{
  id: string,
  slot: string,              // Position: "top", "left", "right", "bottom", "centre", "petal-0", etc.
  label: string,
  domain_colour: string,     // Hex colour (e.g. "#3b82f6")
  description?: string,
  fields: [{
    id: string,
    type: "text" | "textarea" | "number" | "likert" | "checklist" | "select",
    label?: string,
    placeholder?: string,
    min?: number, max?: number, step?: number, suffix?: string,
    options?: [{ id: string, label: string }],
    anchors?: Record<string, string>
  }]
}
```

**FormulationConnection:**
```typescript
{
  from: string,    // Node ID
  to: string,      // Node ID
  style: "arrow" | "arrow_dashed" | "line" | "line_dashed" | "inhibitory",
  direction: "one_way" | "both" | "none",
  label?: string
}
```

**Use for:** CBT formulation diagrams — maintenance cycles, developmental models, vicious flowers.

### 4.15 `record` — Paginated multi-column records

```typescript
{
  id: string,
  type: "record",
  label: string,
  required?: boolean,
  groups: [
    {
      id: string,
      header: string,               // Column header
      width?: "narrow" | "normal" | "wide",  // Grid column sizing
      fields: [                      // Sub-fields within this column
        {
          id: string,
          type: "text" | "textarea" | "number" | "likert" | "checklist" | "select",
          label?: string,
          placeholder?: string,
          min?: number, max?: number, step?: number, suffix?: string,
          anchors?: Record<string, string>,
          options?: [{ id: string, label: string }]
        },
        ...
      ]
    },
    ...
  ],
  min_records?: number,   // Default 1
  max_records?: number    // Default 20
}
```

**Use for:** Classic thought records, behavioural experiments, session records — anything where each entry is a multi-column "card" with compound fields (e.g. textarea + belief slider in one column).

**Value shape:** `{ records: [{ groupId: { fieldId: value }, ... }, ...] }`

**UI:** Paginated cards — one record visible at a time, prev/next navigation, "+" to add more.
**PDF export:** Wide table with groups as column headers, one row per record.
**Limit:** One `record` field per worksheet.

---

## 5. Computed Field Reference Syntax

Computed fields use dot-notation to reference other field values:

| Pattern | Resolves to | Example |
|---------|------------|---------|
| `"fieldId"` | Single top-level field value | `"emotion_intensity"` |
| `"tableId.columnId"` | All row values for that column (array) | `"activity-table.pleasure"` |
| `"recordId.groupId.fieldId"` | All record values for that group/field (array) | `"thought-record.emotion.intensity"` |

**Operations:**
- `"average"` — Mean of all values; needs `field`
- `"sum"` — Total; needs `field`; `format: "integer"` for whole numbers
- `"count"` — Number of filled rows; needs `field` (uses tableId prefix)
- `"difference"` — `field_b - field_a` (after minus before); `format: "percentage_change"` for `"+5% (30% → 35%)"` display
- `"min"` / `"max"` — Minimum/maximum value

---

## 6. Special Layouts

### Cross-Sectional Formulation (`formulation_cross_sectional`)
5 sections with domains: `situation` (top), `thoughts` (left), `emotions` (right), `physical` (bottom-left), `behaviour` (bottom-right). Renders as the classic hot cross bun diagram.

### Vicious Flower (`formulation_vicious_flower`)
Centre section + dynamic petal sections. Uses `dynamic: true`, `item_template`, `default_items` on the petals section.

### Longitudinal Formulation (`formulation_longitudinal`)
Top-to-bottom vertical flow: Early Experiences → Core Beliefs → Rules/Assumptions → Critical Incident → Maintenance Cycle. Final section can use `layout: "four_quadrant"`.

### Decision Tree (`decision_tree`)
Initial question section + branch section with `type: "branch"`, `question`, and `branches.yes` / `branches.no`.

### Safety Plan (`safety_plan`)
Sequential numbered steps. Each section has `step`, `label`, `hint`. Step 6 typically has `highlight: "red"`.

---

## 7. Existing Worksheets (All 34)

### General CBT Skills
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 1 | 5-Column Thought Record | `5-column-thought-record` | textarea, text, likert, table (6 cols), likert | 15 |
| 2 | 7-Column Thought Record | `7-column-thought-record` | table (8 cols), computed (difference) | 15 |
| 3 | Cognitive Distortions Checklist | `cognitive-distortions-checklist` | textarea, checklist (12 options), textarea | 10 |
| 4 | Behavioural Experiment Planner | `behavioural-experiment-planner` | textarea, likert, textarea, textarea, likert, textarea | 20 |
| 5 | Values Assessment | `values-assessment` | table (3 cols: domain/importance/action), textarea | 15 |
| 6 | Relapse Prevention Plan | `relapse-prevention-plan` | checklist, textarea, textarea, textarea | 20 |
| 7 | Cross-Sectional Formulation (5-Area Model) | `cross-sectional-formulation` | textarea ×5 (domain-coded) | 15 |
| 8 | Longitudinal Formulation (Beckian) | `longitudinal-formulation` | textarea ×5 (with highlight, four_quadrant) | 30 |
| 9 | Safety Plan | `safety-plan` | 6 safety_plan steps (textarea each) | 20 |

### Depression
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 10 | Behavioural Activation Activity Schedule | `behavioural-activation-schedule` | table (6 cols), computed (avg×2) | 20 |
| 11 | Activity & Mood Diary | `activity-mood-diary` | date, table (4 cols: time/activity/mood/notes), likert, textarea | 10 |
| 12 | Depression Formulation | `depression-formulation` | textarea ×5 (domain-coded sections) | 20 |

### Generalised Anxiety (GAD)
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 13 | Worry Log | `worry-log` | table (5 cols: trigger/type/intensity/challenge/outcome), textarea | 10 |
| 14 | Worry Decision Tree | `worry-decision-tree` | text, branch (yes/no with outcome text) | 5 |
| 15 | Tolerating Uncertainty Practice | `tolerating-uncertainty-practice` | textarea, likert (0-100), textarea, textarea, likert (0-100), textarea | 10 |

### OCD
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 16 | ERP Hierarchy Builder | `erp-hierarchy-builder` | textarea, textarea, hierarchy (gradient_bar), computed (count) | 25 |
| 17 | OCD Formulation (Vicious Flower) | `ocd-vicious-flower-formulation` | textarea (centre), dynamic petals (text+textarea) | 20 |
| 18 | ERP Practice Record | `erp-practice-record` | table (6 cols: trigger/obsession/compulsion/suds×2/notes), textarea | 15 |

### Social Anxiety
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 19 | Social Situation Record | `social-situation-record` | textarea, textarea, likert, checklist (5 options), textarea, textarea, likert | 15 |

### Health Anxiety
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 20 | Health Anxiety Monitoring Log | `health-anxiety-monitoring-log` | table (5 cols: symptom/interpretation/anxiety/evidence/reappraisal), textarea | 10 |

### Panic Disorder
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 21 | Panic Diary | `panic-diary` | table (6 cols: date/trigger/symptoms/peak-anxiety/misinterpretation/alternative), textarea | 10 |

### PTSD / Trauma
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 22 | Trauma Impact Statement | `trauma-impact-statement` | textarea ×5 (beliefs about self/others/world + safety + control), textarea, textarea | 30 |
| 23 | Grounding Techniques Practice | `grounding-techniques-practice` | textarea, checklist (5 techniques), table (3 cols: technique/situation/effectiveness), textarea | 10 |

### Low Self-Esteem
| # | Title | Slug | Field Types Used | Est. Min |
|---|-------|------|-----------------|----------|
| 24 | Positive Data Log | `positive-data-log` | textarea (core belief), table (4 cols: date/event/strength/belief-change), textarea | 10 |
| 25 | Low Self-Esteem Formulation | `low-self-esteem-formulation` | textarea ×6 (early-exp/beliefs/rules/trigger/naps/predictions) | 20 |

---

## 8. Complete Schema Examples

### Example 1: Simple mixed-field worksheet (Behavioural Experiment Planner)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "prediction",
      "title": "The Prediction",
      "description": "What do you predict will happen?",
      "fields": [
        {
          "id": "thought",
          "type": "textarea",
          "label": "Negative automatic thought / prediction",
          "placeholder": "e.g. If I speak up in the meeting, everyone will think I'm stupid",
          "required": true
        },
        {
          "id": "belief_before",
          "type": "likert",
          "label": "How strongly do you believe this? (0–100%)",
          "min": 0,
          "max": 100,
          "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        }
      ]
    },
    {
      "id": "experiment",
      "title": "The Experiment",
      "fields": [
        {
          "id": "experiment_plan",
          "type": "textarea",
          "label": "What experiment could you do to test this prediction?",
          "placeholder": "Be specific: what will you do, when, and where?"
        },
        {
          "id": "what_happened",
          "type": "textarea",
          "label": "What actually happened?",
          "placeholder": "Describe the outcome in detail"
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "belief_after",
          "type": "likert",
          "label": "How strongly do you believe the original prediction now? (0–100%)",
          "min": 0,
          "max": 100,
          "step": 5,
          "anchors": { "0": "Not at all", "50": "Somewhat", "100": "Completely" }
        },
        {
          "id": "learning",
          "type": "textarea",
          "label": "What did you learn?",
          "placeholder": "What does this tell you about your prediction?"
        }
      ]
    }
  ]
}
```

### Example 2: Table with computed fields (Activity Schedule)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "schedule",
      "fields": [
        {
          "id": "activity-table",
          "type": "table",
          "label": "Activity Schedule",
          "columns": [
            { "id": "day", "header": "Day", "type": "text", "width": "narrow" },
            { "id": "time", "header": "Time", "type": "text" },
            { "id": "planned", "header": "Activity (Planned)", "type": "text" },
            { "id": "actual", "header": "Activity (Actual)", "type": "text" },
            { "id": "pleasure", "header": "Pleasure (0-10)", "type": "number", "min": 0, "max": 10 },
            { "id": "mastery", "header": "Mastery (0-10)", "type": "number", "min": 0, "max": 10 }
          ],
          "min_rows": 1,
          "max_rows": 28
        },
        {
          "id": "avg-pleasure",
          "type": "computed",
          "label": "Avg pleasure",
          "computation": { "operation": "average", "field": "activity-table.pleasure" }
        },
        {
          "id": "avg-mastery",
          "type": "computed",
          "label": "Avg mastery",
          "computation": { "operation": "average", "field": "activity-table.mastery" }
        }
      ]
    }
  ]
}
```

### Example 3: Table with belief-change computed (7-Column Thought Record)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "thought-record",
      "fields": [
        {
          "id": "record-table",
          "type": "table",
          "label": "7-Column Thought Record",
          "columns": [
            { "id": "situation", "header": "Situation", "type": "textarea" },
            { "id": "emotion", "header": "Emotion", "type": "textarea" },
            { "id": "hot_thought", "header": "Hot Thought", "type": "textarea" },
            { "id": "belief_before", "header": "Belief Before", "type": "number", "min": 0, "max": 100, "suffix": "%" },
            { "id": "evidence_for", "header": "Evidence For", "type": "textarea" },
            { "id": "evidence_against", "header": "Evidence Against", "type": "textarea" },
            { "id": "balanced_thought", "header": "Balanced Thought", "type": "textarea" },
            { "id": "belief_after", "header": "Belief After", "type": "number", "min": 0, "max": 100, "suffix": "%" }
          ],
          "min_rows": 1,
          "max_rows": 10
        },
        {
          "id": "belief-change",
          "type": "computed",
          "label": "Belief change",
          "computation": {
            "operation": "difference",
            "field_a": "record-table.belief_before",
            "field_b": "record-table.belief_after",
            "format": "percentage_change"
          }
        }
      ]
    }
  ]
}
```

### Example 4: Hierarchy field with gradient bar (ERP Exposure Hierarchy)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "hierarchy",
      "fields": [
        {
          "id": "exposure-list",
          "type": "hierarchy",
          "label": "Exposure Hierarchy",
          "columns": [
            { "id": "situation", "header": "Exposure Step", "type": "textarea" },
            { "id": "suds", "header": "SUDS (0-100)", "type": "number", "min": 0, "max": 100 }
          ],
          "sort_by": "suds",
          "sort_direction": "desc",
          "min_rows": 3,
          "max_rows": 15,
          "visualisation": "gradient_bar",
          "gradient": {
            "low": "#e8f5e9",
            "mid": "#e4a930",
            "high": "#dc2626"
          }
        },
        {
          "id": "step-count",
          "type": "computed",
          "label": "Auto-sorted by SUDS (highest → lowest)",
          "computation": { "operation": "count", "field": "exposure-list" }
        }
      ]
    }
  ]
}
```

### Example 5: Checklist field (ERP Hierarchy Builder — coping strategies)

```json
{
  "id": "coping_strategies",
  "type": "checklist",
  "label": "Coping strategies to use during exposures",
  "options": [
    { "id": "mindfulness", "label": "Mindful awareness of anxiety (observe without reacting)" },
    { "id": "acceptance", "label": "Accept uncertainty (\"I can tolerate not knowing\")" },
    { "id": "surfing", "label": "Urge surfing (ride the wave of discomfort)" },
    { "id": "values", "label": "Connect to values (why am I doing this?)" },
    { "id": "self_compassion", "label": "Self-compassion (this is hard and I am brave)" }
  ]
}
```

### Example 6: Cross-sectional formulation (5-Area Model)

```json
{
  "version": 1,
  "layout": "formulation_cross_sectional",
  "sections": [
    {
      "id": "situation",
      "domain": "situation",
      "fields": [{
        "id": "trigger", "type": "textarea",
        "label": "Situation / Trigger",
        "placeholder": "What happened? Where were you? Who were you with?"
      }]
    },
    {
      "id": "thoughts",
      "domain": "thoughts",
      "fields": [{
        "id": "thoughts", "type": "textarea",
        "label": "Thoughts",
        "placeholder": "What went through your mind?"
      }]
    },
    {
      "id": "emotions",
      "domain": "emotions",
      "fields": [{
        "id": "emotions", "type": "textarea",
        "label": "Emotions",
        "placeholder": "What did you feel? Rate 0–100"
      }]
    },
    {
      "id": "physical",
      "domain": "physical",
      "fields": [{
        "id": "sensations", "type": "textarea",
        "label": "Physical Sensations",
        "placeholder": "What did you notice in your body?"
      }]
    },
    {
      "id": "behaviour",
      "domain": "behaviour",
      "fields": [{
        "id": "behaviour", "type": "textarea",
        "label": "Behaviour",
        "placeholder": "What did you do? What did you avoid?"
      }]
    }
  ]
}
```

### Example 7: Decision tree (Worry Decision Tree)

```json
{
  "version": 1,
  "layout": "decision_tree",
  "sections": [
    {
      "id": "worry",
      "title": "Notice the Worry",
      "fields": [{
        "id": "worry_content", "type": "text",
        "label": "Notice the Worry",
        "placeholder": "What am I worrying about?"
      }]
    },
    {
      "id": "decision",
      "type": "branch",
      "question": "Can I do something about this right now?",
      "branches": {
        "yes": {
          "label": "Yes — practical worry",
          "colour": "green",
          "fields": [{
            "id": "action_plan", "type": "text",
            "label": "Action Plan",
            "placeholder": "What can I do? When?"
          }],
          "outcome": "Do it, then let the worry go. Refocus attention on what you're doing right now."
        },
        "no": {
          "label": "No — hypothetical worry",
          "colour": "red",
          "outcome": "Let the worry go — it's hypothetical. Refocus: what can you see, hear, touch right now?"
        }
      },
      "fields": []
    }
  ]
}
```

### Example 8: Safety plan

```json
{
  "version": 1,
  "layout": "safety_plan",
  "sections": [
    {
      "id": "step-1", "step": 1, "label": "Warning Signs",
      "hint": "Thoughts, images, moods, situations, behaviours that signal a crisis may be developing",
      "fields": [{ "id": "warning_signs", "type": "textarea", "label": "", "placeholder": "What are the early warning signs for you?" }]
    },
    {
      "id": "step-2", "step": 2, "label": "Internal Coping Strategies",
      "hint": "Things I can do on my own to take my mind off problems",
      "fields": [{ "id": "coping", "type": "textarea", "label": "", "placeholder": "Activities, places, distractions that help" }]
    },
    {
      "id": "step-3", "step": 3, "label": "People & Social Settings That Provide Distraction",
      "hint": "People I can contact, places I can go — without necessarily discussing the crisis",
      "fields": [{ "id": "social_distraction", "type": "textarea", "label": "", "placeholder": "Names, places, contact details" }]
    },
    {
      "id": "step-4", "step": 4, "label": "People I Can Ask for Help",
      "hint": "People I trust enough to talk to about how I'm feeling",
      "fields": [{ "id": "help_contacts", "type": "textarea", "label": "", "placeholder": "Name and contact details" }]
    },
    {
      "id": "step-5", "step": 5, "label": "Professional & Crisis Support",
      "hint": "Therapist, GP, crisis team, helplines",
      "fields": [{ "id": "professional_support", "type": "textarea", "label": "", "placeholder": "Names, numbers, services" }]
    },
    {
      "id": "step-6", "step": 6, "label": "Making the Environment Safe",
      "highlight": "red",
      "hint": "Steps to reduce access to means",
      "fields": [{ "id": "environment_safety", "type": "textarea", "label": "", "placeholder": "What can I do to make my environment safer?" }]
    }
  ]
}
```

### Example 9: Vicious flower formulation (OCD)

```json
{
  "version": 1,
  "layout": "formulation_vicious_flower",
  "sections": [
    {
      "id": "centre",
      "fields": [{
        "id": "presenting_problem", "type": "textarea",
        "label": "Presenting Problem",
        "placeholder": "Central problem / presenting issue"
      }]
    },
    {
      "id": "petals",
      "dynamic": true,
      "min_items": 3,
      "max_items": 8,
      "item_template": {
        "fields": [
          { "id": "petal_label", "type": "text", "label": "Factor Label", "placeholder": "e.g. Avoidance, Rumination, Safety Behaviours" },
          { "id": "petal_content", "type": "textarea", "label": "Description", "placeholder": "How does this maintain the problem?" }
        ]
      },
      "default_items": [
        { "petal_label": "Thoughts", "domain": "thoughts" },
        { "petal_label": "Emotions", "domain": "emotions" },
        { "petal_label": "Body", "domain": "physical" },
        { "petal_label": "Behaviour", "domain": "behaviour" },
        { "petal_label": "Reassurance", "domain": "reassurance" },
        { "petal_label": "Attention", "domain": "attention" }
      ],
      "fields": []
    }
  ]
}
```

### Example 10: Longitudinal formulation (Beckian)

```json
{
  "version": 1,
  "layout": "formulation_longitudinal",
  "sections": [
    {
      "id": "early_experiences",
      "title": "Early Experiences",
      "fields": [{
        "id": "experiences", "type": "textarea",
        "label": "Early Experiences",
        "placeholder": "Relevant early experiences, upbringing, significant events"
      }]
    },
    {
      "id": "core_beliefs",
      "title": "Core Beliefs",
      "highlight": "amber",
      "fields": [{
        "id": "beliefs", "type": "textarea",
        "label": "Core Beliefs",
        "placeholder": "About self, others, the world"
      }]
    },
    {
      "id": "rules_assumptions",
      "title": "Rules & Assumptions",
      "fields": [{
        "id": "rules", "type": "textarea",
        "label": "Rules & Assumptions",
        "placeholder": "Conditional beliefs, rules for living"
      }]
    },
    {
      "id": "critical_incident",
      "title": "Critical Incident",
      "highlight": "red_dashed",
      "fields": [{
        "id": "incident", "type": "textarea",
        "label": "Critical Incident",
        "placeholder": "What activated the problem?"
      }]
    },
    {
      "id": "maintenance_cycle",
      "title": "Maintenance Cycle",
      "layout": "four_quadrant",
      "fields": [
        { "id": "cycle_thoughts", "type": "textarea", "label": "Thoughts", "domain": "thoughts", "placeholder": "Automatic thoughts" },
        { "id": "cycle_emotions", "type": "textarea", "label": "Emotions", "domain": "emotions", "placeholder": "Emotional responses" },
        { "id": "cycle_physical", "type": "textarea", "label": "Physical", "domain": "physical", "placeholder": "Physical sensations" },
        { "id": "cycle_behaviour", "type": "textarea", "label": "Behaviour", "domain": "behaviour", "placeholder": "Behavioural responses" }
      ]
    }
  ]
}
```

### Example 11: Record field (5-Column Thought Record as paginated cards)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "instructions",
      "title": "Instructions",
      "description": "Use this when you notice a mood shift. Complete one card per triggering event.",
      "fields": []
    },
    {
      "id": "records",
      "title": "Thought Records",
      "fields": [
        {
          "id": "thought-record",
          "type": "record",
          "label": "Thought Record Entry",
          "min_records": 1,
          "max_records": 10,
          "groups": [
            {
              "id": "situation",
              "header": "Situation",
              "width": "normal",
              "fields": [
                { "id": "description", "type": "textarea", "placeholder": "What happened? Where? When? Who?" }
              ]
            },
            {
              "id": "thought",
              "header": "Automatic Thought",
              "width": "normal",
              "fields": [
                { "id": "content", "type": "textarea", "placeholder": "What went through your mind?" },
                { "id": "belief", "type": "likert", "label": "Belief %", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "emotion",
              "header": "Emotion",
              "width": "narrow",
              "fields": [
                { "id": "name", "type": "text", "placeholder": "e.g. Anxious, Sad" },
                { "id": "intensity", "type": "likert", "label": "Intensity", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "alternative",
              "header": "Alternative Thought",
              "width": "normal",
              "fields": [
                { "id": "content", "type": "textarea", "placeholder": "What's a more balanced way to see this?" },
                { "id": "belief", "type": "likert", "label": "Belief %", "min": 0, "max": 100, "step": 5 }
              ]
            },
            {
              "id": "outcome",
              "header": "Outcome",
              "width": "narrow",
              "fields": [
                { "id": "re_rate", "type": "likert", "label": "Re-rate belief", "min": 0, "max": 100, "step": 5 },
                { "id": "notes", "type": "textarea", "placeholder": "What changed?" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "reflection",
      "title": "Reflection",
      "fields": [
        {
          "id": "patterns",
          "type": "textarea",
          "label": "What patterns do you notice across your thought records?"
        }
      ]
    }
  ]
}
```

---

## 9. Rules and Conventions

### ID naming
- Use **kebab-case** for all IDs: `"emotion-intensity"`, `"thought-record"`, `"belief-before"`
- Section IDs should be short and descriptive: `"context"`, `"reflection"`, `"hierarchy"`
- Field IDs should describe the data: `"situation"`, `"belief_rating"`, `"coping_strategies"`
- Underscores are acceptable in field IDs for multi-word names

### Slug naming
- URL-safe kebab-case: `"5-column-thought-record"`, `"erp-hierarchy-builder"`
- Must be unique across all worksheets

### Clinical conventions
- Use British English spellings: "behaviour" not "behavior", "recognise" not "recognize"
- SUDS = Subjective Units of Distress Scale (0-100)
- Always provide helpful placeholders with concrete examples
- Use `required: true` sparingly — only for the primary identifying field
- Instructions should guide the client through the worksheet step by step

### Tags
- Lowercase, comma-separated concepts
- Include: therapy type, target condition, technique name
- Example: `['cognitive restructuring', 'thought records', 'CBT', 'automatic thoughts']`

### Estimated minutes
- Simple single-section worksheets: 5-10 minutes
- Multi-section worksheets: 10-20 minutes
- Complex formulations or long tables: 20-30 minutes

### Section structure patterns
1. **Context → Main tool → Reflection** — Most common pattern
2. **Before → Intervention → After** — For experiments/exposure
3. **Trigger → Response → Alternative → Outcome** — For cognitive restructuring
4. **Sequential steps** — For safety plans, grounding protocols

### Field selection guidelines
- **textarea** for any narrative/descriptive content (most fields)
- **text** only for short labels (emotion name, day of week)
- **likert** for subjective 0-100 or 0-10 ratings (always preferred over bare number for scales)
- **number** for objective counts or within table columns
- **table** when multiple entries share the same column structure
- **record** when entries need compound/multi-type columns (textarea + likert in same "column")
- **checklist** for selecting from known clinical options
- **select** for single-choice from a fixed list
- **computed** for automatic summaries (place after the field it references)
- **formulation** for visual CBT diagrams (max one per worksheet)
- **record** for paginated card-based entries (max one per worksheet)

### SQL insert pattern
```sql
INSERT INTO worksheets (
  category_id, title, slug, description, instructions, schema,
  is_published, is_premium, tags, estimated_minutes, display_order
) VALUES (
  (SELECT id FROM categories WHERE slug = 'category-slug'),
  'Title',
  'slug',
  'Short description for listings.',
  'Detailed instructions shown when filling in the worksheet.',
  '{ "version": 1, "sections": [...] }',
  true,           -- is_published
  true,           -- is_premium (false for free worksheets)
  ARRAY['tag1', 'tag2', 'tag3'],
  15,             -- estimated_minutes
  1               -- display_order within category
);
```
