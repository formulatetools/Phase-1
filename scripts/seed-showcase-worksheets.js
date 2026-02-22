// Seed / update the 8 showcase worksheets with extended field type schemas
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gjjvlqxlzfoxkcbjmktn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqanZscXhsemZveGtjYmpta3RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTYxOSwiZXhwIjoyMDg3MzI3NjE5fQ.wXNDQC3f5mrEpAmKE9ZEhglR_D-fsKd6kqOdTFFEQrk'
);

// Category IDs
const CATS = {
  general: '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  depression: '0fa9fd47-7185-471f-a096-870c9231f843',
  ocd: '07036cf2-914a-4bd8-b0bc-066a69ef1c8c',
  gad: '7595b42f-c4aa-467b-8588-1c62e160008a',
};

// ─────────────────────────────────────────────────
// 1. Cross-Sectional Formulation (NEW)
// ─────────────────────────────────────────────────
const crossSectional = {
  title: 'Cross-Sectional Formulation (5-Area Model)',
  slug: 'cross-sectional-formulation',
  description: 'Map how thoughts, emotions, physical sensations, and behaviour interact around a triggering situation using the CBT 5-area model.',
  instructions: 'Identify a recent situation that triggered distress. Fill in each area to understand the maintenance cycle.',
  category_id: CATS.general,
  tags: ['formulation', 'five areas', 'maintenance cycle', 'health anxiety', 'depression'],
  estimated_minutes: 15,
  is_published: true,
  is_free: true,
  schema: {
    version: 1,
    layout: 'formulation_cross_sectional',
    sections: [
      {
        id: 'situation',
        domain: 'situation',
        fields: [{
          id: 'trigger', type: 'textarea',
          label: 'Situation / Trigger',
          placeholder: 'What happened? Where were you? Who were you with?'
        }]
      },
      {
        id: 'thoughts',
        domain: 'thoughts',
        fields: [{
          id: 'thoughts', type: 'textarea',
          label: 'Thoughts',
          placeholder: 'What went through your mind?'
        }]
      },
      {
        id: 'emotions',
        domain: 'emotions',
        fields: [{
          id: 'emotions', type: 'textarea',
          label: 'Emotions',
          placeholder: 'What did you feel? Rate 0\u2013100'
        }]
      },
      {
        id: 'physical',
        domain: 'physical',
        fields: [{
          id: 'sensations', type: 'textarea',
          label: 'Physical Sensations',
          placeholder: 'What did you notice in your body?'
        }]
      },
      {
        id: 'behaviour',
        domain: 'behaviour',
        fields: [{
          id: 'behaviour', type: 'textarea',
          label: 'Behaviour',
          placeholder: 'What did you do? What did you avoid?'
        }]
      }
    ]
  }
};

// ─────────────────────────────────────────────────
// 2. 7-Column Thought Record (UPDATE existing)
// ─────────────────────────────────────────────────
const thoughtRecord = {
  slug: '7-column-thought-record',
  schema: {
    version: 1,
    sections: [{
      id: 'thought-record',
      fields: [{
        id: 'record-table', type: 'table',
        label: '7-Column Thought Record',
        columns: [
          { id: 'situation', header: 'Situation', type: 'textarea' },
          { id: 'emotion', header: 'Emotion', type: 'textarea' },
          { id: 'hot_thought', header: 'Hot Thought', type: 'textarea' },
          { id: 'belief_before', header: 'Belief Before', type: 'number', min: 0, max: 100, suffix: '%' },
          { id: 'evidence_for', header: 'Evidence For', type: 'textarea' },
          { id: 'evidence_against', header: 'Evidence Against', type: 'textarea' },
          { id: 'balanced_thought', header: 'Balanced Thought', type: 'textarea' },
          { id: 'belief_after', header: 'Belief After', type: 'number', min: 0, max: 100, suffix: '%' }
        ],
        min_rows: 1,
        max_rows: 10
      },
      {
        id: 'belief-change', type: 'computed',
        label: 'Belief change',
        computation: {
          operation: 'difference',
          field_a: 'record-table.belief_before',
          field_b: 'record-table.belief_after',
          format: 'percentage_change'
        }
      }]
    }]
  }
};

// ─────────────────────────────────────────────────
// 3. Vicious Flower (UPDATE existing)
// ─────────────────────────────────────────────────
const viciousFlower = {
  slug: 'ocd-vicious-flower-formulation',
  schema: {
    version: 1,
    layout: 'formulation_vicious_flower',
    sections: [
      {
        id: 'centre',
        fields: [{
          id: 'presenting_problem', type: 'textarea',
          label: 'Presenting Problem',
          placeholder: 'Central problem / presenting issue'
        }]
      },
      {
        id: 'petals',
        dynamic: true,
        min_items: 3,
        max_items: 8,
        item_template: {
          fields: [
            { id: 'petal_label', type: 'text', label: 'Factor Label', placeholder: 'e.g. Avoidance, Rumination, Safety Behaviours' },
            { id: 'petal_content', type: 'textarea', label: 'Description', placeholder: 'How does this maintain the problem?' }
          ]
        },
        default_items: [
          { petal_label: 'Thoughts', domain: 'thoughts' },
          { petal_label: 'Emotions', domain: 'emotions' },
          { petal_label: 'Body', domain: 'physical' },
          { petal_label: 'Behaviour', domain: 'behaviour' },
          { petal_label: 'Reassurance', domain: 'reassurance' },
          { petal_label: 'Attention', domain: 'attention' }
        ],
        fields: []
      }
    ]
  }
};

// ─────────────────────────────────────────────────
// 4. Longitudinal Formulation (NEW)
// ─────────────────────────────────────────────────
const longitudinal = {
  title: 'Longitudinal Formulation (Beckian)',
  slug: 'longitudinal-formulation',
  description: 'Map the developmental pathway from early experiences through core beliefs and rules to the current maintenance cycle.',
  instructions: 'Work through each section from top to bottom, building a picture of how past experiences shape current difficulties.',
  category_id: CATS.general,
  tags: ['formulation', 'beckian', 'developmental', 'core beliefs'],
  estimated_minutes: 30,
  is_published: true,
  is_free: false,
  schema: {
    version: 1,
    layout: 'formulation_longitudinal',
    sections: [
      {
        id: 'early_experiences',
        title: 'Early Experiences',
        fields: [{
          id: 'experiences', type: 'textarea',
          label: 'Early Experiences',
          placeholder: 'Relevant early experiences, upbringing, significant events'
        }]
      },
      {
        id: 'core_beliefs',
        title: 'Core Beliefs',
        highlight: 'amber',
        fields: [{
          id: 'beliefs', type: 'textarea',
          label: 'Core Beliefs',
          placeholder: 'About self, others, the world'
        }]
      },
      {
        id: 'rules_assumptions',
        title: 'Rules & Assumptions',
        fields: [{
          id: 'rules', type: 'textarea',
          label: 'Rules & Assumptions',
          placeholder: 'Conditional beliefs, rules for living'
        }]
      },
      {
        id: 'critical_incident',
        title: 'Critical Incident',
        highlight: 'red_dashed',
        fields: [{
          id: 'incident', type: 'textarea',
          label: 'Critical Incident',
          placeholder: 'What activated the problem?'
        }]
      },
      {
        id: 'maintenance_cycle',
        title: 'Maintenance Cycle',
        layout: 'four_quadrant',
        fields: [
          { id: 'cycle_thoughts', type: 'textarea', label: 'Thoughts', domain: 'thoughts', placeholder: 'Automatic thoughts' },
          { id: 'cycle_emotions', type: 'textarea', label: 'Emotions', domain: 'emotions', placeholder: 'Emotional responses' },
          { id: 'cycle_physical', type: 'textarea', label: 'Physical', domain: 'physical', placeholder: 'Physical sensations' },
          { id: 'cycle_behaviour', type: 'textarea', label: 'Behaviour', domain: 'behaviour', placeholder: 'Behavioural responses' }
        ]
      }
    ]
  }
};

// ─────────────────────────────────────────────────
// 5. Behavioural Activation Schedule (UPDATE existing)
// ─────────────────────────────────────────────────
const baSchedule = {
  slug: 'behavioural-activation-schedule',
  schema: {
    version: 1,
    sections: [{
      id: 'schedule',
      fields: [{
        id: 'activity-table', type: 'table',
        label: 'Activity Schedule',
        columns: [
          { id: 'day', header: 'Day', type: 'text', width: 'narrow' },
          { id: 'time', header: 'Time', type: 'text' },
          { id: 'planned', header: 'Activity (Planned)', type: 'text' },
          { id: 'actual', header: 'Activity (Actual)', type: 'text' },
          { id: 'pleasure', header: 'Pleasure (0-10)', type: 'number', min: 0, max: 10 },
          { id: 'mastery', header: 'Mastery (0-10)', type: 'number', min: 0, max: 10 }
        ],
        min_rows: 1,
        max_rows: 28
      },
      {
        id: 'avg-pleasure', type: 'computed',
        label: 'Avg pleasure',
        computation: { operation: 'average', field: 'activity-table.pleasure', group_by: 'day' }
      },
      {
        id: 'avg-mastery', type: 'computed',
        label: 'Avg mastery',
        computation: { operation: 'average', field: 'activity-table.mastery', group_by: 'day' }
      }]
    }]
  }
};

// ─────────────────────────────────────────────────
// 6. ERP Exposure Hierarchy (UPDATE existing)
// ─────────────────────────────────────────────────
const erpHierarchy = {
  slug: 'erp-hierarchy-builder',
  schema: {
    version: 1,
    sections: [{
      id: 'hierarchy',
      fields: [{
        id: 'exposure-list', type: 'hierarchy',
        label: 'Exposure Hierarchy',
        columns: [
          { id: 'situation', header: 'Exposure Step', type: 'textarea' },
          { id: 'suds', header: 'SUDS (0-100)', type: 'number', min: 0, max: 100 }
        ],
        sort_by: 'suds',
        sort_direction: 'desc',
        min_rows: 3,
        max_rows: 15,
        visualisation: 'gradient_bar',
        gradient: {
          low: '#e8f5e9',
          mid: '#e4a930',
          high: '#dc2626'
        }
      },
      {
        id: 'step-count', type: 'computed',
        label: 'Auto-sorted by SUDS (highest \u2192 lowest)',
        computation: { operation: 'count', field: 'exposure-list' }
      }]
    }]
  }
};

// ─────────────────────────────────────────────────
// 7. Worry Decision Tree (UPDATE existing)
// ─────────────────────────────────────────────────
const worryTree = {
  slug: 'worry-decision-tree',
  schema: {
    version: 1,
    layout: 'decision_tree',
    sections: [
      {
        id: 'worry',
        title: 'Notice the Worry',
        fields: [{
          id: 'worry_content', type: 'text',
          label: 'Notice the Worry',
          placeholder: 'What am I worrying about?'
        }]
      },
      {
        id: 'decision',
        type: 'branch',
        question: 'Can I do something about this right now?',
        branches: {
          yes: {
            label: 'Yes \u2014 practical worry',
            colour: 'green',
            fields: [{
              id: 'action_plan', type: 'text',
              label: 'Action Plan',
              placeholder: 'What can I do? When?'
            }],
            outcome: 'Do it, then let the worry go. Refocus attention on what you\u2019re doing right now.'
          },
          no: {
            label: 'No \u2014 hypothetical worry',
            colour: 'red',
            outcome: 'Let the worry go \u2014 it\u2019s hypothetical. Refocus: what can you see, hear, touch right now?'
          }
        },
        fields: []
      }
    ]
  }
};

// ─────────────────────────────────────────────────
// 8. Safety Plan (NEW)
// ─────────────────────────────────────────────────
const safetyPlan = {
  title: 'Safety Plan',
  slug: 'safety-plan',
  description: 'A structured 6-step safety plan for crisis intervention and suicide prevention.',
  instructions: 'Work through each step with your therapist. Keep this plan somewhere accessible.',
  category_id: CATS.general,
  tags: ['safety plan', 'crisis', 'risk', 'suicide prevention'],
  estimated_minutes: 20,
  is_published: true,
  is_free: true,
  schema: {
    version: 1,
    layout: 'safety_plan',
    sections: [
      { id: 'step-1', step: 1, label: 'Warning Signs',
        hint: 'Thoughts, images, moods, situations, behaviours that signal a crisis may be developing',
        fields: [{ id: 'warning_signs', type: 'textarea', label: '', placeholder: 'What are the early warning signs for you?' }]
      },
      { id: 'step-2', step: 2, label: 'Internal Coping Strategies',
        hint: 'Things I can do on my own to take my mind off problems',
        fields: [{ id: 'coping', type: 'textarea', label: '', placeholder: 'Activities, places, distractions that help' }]
      },
      { id: 'step-3', step: 3, label: 'People & Social Settings That Provide Distraction',
        hint: 'People I can contact, places I can go \u2014 without necessarily discussing the crisis',
        fields: [{ id: 'social_distraction', type: 'textarea', label: '', placeholder: 'Names, places, contact details' }]
      },
      { id: 'step-4', step: 4, label: 'People I Can Ask for Help',
        hint: 'People I trust enough to talk to about how I\u2019m feeling',
        fields: [{ id: 'help_contacts', type: 'textarea', label: '', placeholder: 'Name and contact details' }]
      },
      { id: 'step-5', step: 5, label: 'Professional & Crisis Support',
        hint: 'Therapist, GP, crisis team, helplines',
        fields: [{ id: 'professional_support', type: 'textarea', label: '', placeholder: 'Names, numbers, services' }]
      },
      { id: 'step-6', step: 6, label: 'Making the Environment Safe',
        highlight: 'red',
        hint: 'Steps to reduce access to means',
        fields: [{ id: 'environment_safety', type: 'textarea', label: '', placeholder: 'What can I do to make my environment safer?' }]
      }
    ]
  }
};

async function main() {
  // --- INSERT NEW worksheets ---
  const newWorksheets = [crossSectional, longitudinal, safetyPlan];

  for (const ws of newWorksheets) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('worksheets')
      .select('id')
      .eq('slug', ws.slug)
      .single();

    if (existing) {
      // Update the schema
      const { error } = await supabase
        .from('worksheets')
        .update({ schema: ws.schema })
        .eq('id', existing.id);
      if (error) {
        console.error(`Failed to update ${ws.slug}:`, error);
      } else {
        console.log(`Updated: ${ws.slug}`);
      }
    } else {
      const { error } = await supabase
        .from('worksheets')
        .insert(ws);
      if (error) {
        console.error(`Failed to insert ${ws.slug}:`, error);
      } else {
        console.log(`Created: ${ws.slug}`);
      }
    }
  }

  // --- UPDATE existing worksheets with new schemas ---
  const updates = [thoughtRecord, viciousFlower, baSchedule, erpHierarchy, worryTree];

  for (const u of updates) {
    const { error } = await supabase
      .from('worksheets')
      .update({ schema: u.schema })
      .eq('slug', u.slug);
    if (error) {
      console.error(`Failed to update ${u.slug}:`, error);
    } else {
      console.log(`Updated: ${u.slug}`);
    }
  }

  console.log('\nDone! All 8 showcase worksheets seeded/updated.');
}

main().catch(console.error);
