// Clinical formulation templates — starting points for common CBT models
// Therapists pick a template, the builder pre-populates, they customise and save

import type {
  FormulationNode,
  FormulationConnection,
  FormulationLayoutPattern,
} from '@/types/worksheet'

export interface FormulationTemplate {
  id: string
  name: string
  description: string
  source: string                // Academic source / author
  pattern: FormulationLayoutPattern
  tags: string[]
  nodes: FormulationNode[]
  connections: FormulationConnection[]
}

// ============================================================================
// 1. Generic Five Areas (CBT)
// ============================================================================

const genericFiveAreas: FormulationTemplate = {
  id: 'tpl-five-areas',
  name: 'Generic Five Areas',
  description: 'Standard CBT five areas model with bidirectional relationships',
  source: 'Generic CBT',
  pattern: 'cross_sectional',
  tags: ['CBT', 'five areas', 'generic'],
  nodes: [
    {
      id: 'trigger', slot: 'top', label: 'Situation / Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Noticed heart racing while sitting at desk' }],
    },
    {
      id: 'thoughts', slot: 'left', label: 'Thoughts', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I\'m having a heart attack"' }],
    },
    {
      id: 'emotions', slot: 'centre', label: 'Emotions', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Anxious, scared' }],
    },
    {
      id: 'physical', slot: 'right', label: 'Physical Sensations', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Heart pounding, sweating, dizziness' }],
    },
    {
      id: 'behaviour', slot: 'bottom', label: 'Behaviour', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Left the room, called 999' }],
    },
  ],
  connections: [
    { from: 'trigger', to: 'thoughts', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'emotions', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'physical', style: 'arrow', direction: 'one_way' },
    { from: 'thoughts', to: 'emotions', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'emotions', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'emotions', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'physical', to: 'behaviour', style: 'arrow', direction: 'one_way' },
  ],
}

// ============================================================================
// 2. Health Anxiety Maintenance (Salkovskis & Warwick)
// ============================================================================

const healthAnxiety: FormulationTemplate = {
  id: 'tpl-health-anxiety',
  name: 'Health Anxiety Maintenance',
  description: 'Salkovskis & Warwick health anxiety maintenance model',
  source: 'Salkovskis & Warwick',
  pattern: 'cross_sectional',
  tags: ['CBT', 'health anxiety', 'maintenance'],
  nodes: [
    {
      id: 'trigger', slot: 'top', label: 'Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Noticed a headache, read about brain tumours online' }],
    },
    {
      id: 'interpretations', slot: 'left', label: 'Misinterpretations', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "This headache must be a brain tumour"' }],
    },
    {
      id: 'anxiety', slot: 'centre', label: 'Anxiety', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Intense health anxiety, dread' }],
    },
    {
      id: 'body', slot: 'right', label: 'Body Scanning / Sensations', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Heightened awareness of headache, checking body for symptoms' }],
    },
    {
      id: 'safety', slot: 'bottom', label: 'Safety Behaviours', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Googling symptoms, seeking reassurance from GP, avoiding exercise' }],
    },
  ],
  connections: [
    { from: 'trigger', to: 'interpretations', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'anxiety', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'body', style: 'arrow', direction: 'one_way' },
    { from: 'interpretations', to: 'anxiety', style: 'arrow', direction: 'both' },
    { from: 'interpretations', to: 'body', style: 'arrow', direction: 'both' },
    { from: 'anxiety', to: 'body', style: 'arrow', direction: 'both' },
    { from: 'interpretations', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'anxiety', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'body', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'safety', to: 'trigger', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 3. Panic Maintenance Cycle (Clark 1986)
// ============================================================================

const panicCycle: FormulationTemplate = {
  id: 'tpl-panic-cycle',
  name: 'Panic Maintenance Cycle',
  description: 'Clark (1986) catastrophic misinterpretation cycle',
  source: 'Clark (1986)',
  pattern: 'cycle',
  tags: ['CBT', 'panic', 'cycle', 'maintenance'],
  nodes: [
    {
      id: 'cycle-0', slot: 'cycle-0', label: 'Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Internal sensation or external situation' }],
    },
    {
      id: 'cycle-1', slot: 'cycle-1', label: 'Catastrophic Misinterpretation', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I\'m having a heart attack", "I\'m going to faint"' }],
    },
    {
      id: 'cycle-2', slot: 'cycle-2', label: 'Anxiety / Panic', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Intense fear, sense of impending doom' }],
    },
    {
      id: 'cycle-3', slot: 'cycle-3', label: 'Safety Behaviour', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Escape, sit down, call for help, avoid triggers' }],
    },
  ],
  connections: [
    { from: 'cycle-0', to: 'cycle-1', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-1', to: 'cycle-2', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-2', to: 'cycle-3', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-3', to: 'cycle-0', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 4. Social Anxiety Maintenance (Clark & Wells)
// ============================================================================

const socialAnxiety: FormulationTemplate = {
  id: 'tpl-social-anxiety',
  name: 'Social Anxiety Maintenance',
  description: 'Clark & Wells social anxiety maintenance model',
  source: 'Clark & Wells',
  pattern: 'cross_sectional',
  tags: ['CBT', 'social anxiety', 'maintenance'],
  nodes: [
    {
      id: 'trigger', slot: 'top', label: 'Social Situation', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Meeting new people at a party' }],
    },
    {
      id: 'predictions', slot: 'left', label: 'Negative Predictions', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "They\'ll think I\'m boring", "I\'ll say something stupid"' }],
    },
    {
      id: 'anxiety', slot: 'centre', label: 'Anxiety', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Anxious, embarrassed, self-conscious' }],
    },
    {
      id: 'attention', slot: 'right', label: 'Self-Focused Attention', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Monitoring voice, face, hands for signs of anxiety' }],
    },
    {
      id: 'safety', slot: 'bottom', label: 'Safety / Avoidance Behaviours', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Avoiding eye contact, rehearsing sentences, leaving early' }],
    },
  ],
  connections: [
    { from: 'trigger', to: 'predictions', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'anxiety', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'attention', style: 'arrow', direction: 'one_way' },
    { from: 'predictions', to: 'anxiety', style: 'arrow', direction: 'both' },
    { from: 'predictions', to: 'attention', style: 'arrow', direction: 'both' },
    { from: 'anxiety', to: 'attention', style: 'arrow', direction: 'both' },
    { from: 'predictions', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'anxiety', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'attention', to: 'safety', style: 'arrow', direction: 'one_way' },
    { from: 'safety', to: 'trigger', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 5. GAD Metacognitive Model (Wells 1995)
// ============================================================================

const gadMetacognitive: FormulationTemplate = {
  id: 'tpl-gad-metacognitive',
  name: 'GAD Metacognitive Model',
  description: 'Wells (1995) metacognitive model of generalised anxiety',
  source: 'Wells (1995)',
  pattern: 'vertical_flow',
  tags: ['CBT', 'GAD', 'metacognitive', 'worry'],
  nodes: [
    {
      id: 'step-0', slot: 'step-0', label: 'Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. News report about job losses' }],
    },
    {
      id: 'step-1', slot: 'step-1', label: 'Type 1 Worry', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "What if I lose my job?", "What if we can\'t pay rent?"' }],
    },
    {
      id: 'step-2', slot: 'step-2', label: 'Meta-Belief Activation', domain_colour: '#a07850',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "Worrying is uncontrollable", "Worrying will make me go crazy"' }],
    },
    {
      id: 'step-3', slot: 'step-3', label: 'Type 2 Worry (Meta-Worry)', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I can\'t stop worrying", "This worrying will harm me"' }],
    },
    {
      id: 'step-4', slot: 'step-4', label: 'Behavioural Response', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Thought suppression, reassurance seeking, avoidance' }],
    },
  ],
  connections: [
    { from: 'step-0', to: 'step-1', style: 'arrow', direction: 'one_way' },
    { from: 'step-1', to: 'step-2', style: 'arrow', direction: 'one_way' },
    { from: 'step-2', to: 'step-3', style: 'arrow', direction: 'one_way' },
    { from: 'step-3', to: 'step-4', style: 'arrow', direction: 'one_way' },
    { from: 'step-4', to: 'step-1', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 6. PTSD Cognitive Model (Ehlers & Clark 2000)
// ============================================================================

const ptsdEhlersClark: FormulationTemplate = {
  id: 'tpl-ptsd-ehlers-clark',
  name: 'PTSD Cognitive Model',
  description: 'Ehlers & Clark (2000) cognitive model of PTSD',
  source: 'Ehlers & Clark (2000)',
  pattern: 'vertical_flow',
  tags: ['CBT', 'PTSD', 'trauma', 'cognitive'],
  nodes: [
    {
      id: 'step-0', slot: 'step-0', label: 'Trauma Memory', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Fragmented, disorganised memory of the traumatic event' }],
    },
    {
      id: 'step-1', slot: 'step-1', label: 'Negative Appraisals', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I\'m permanently damaged", "Nowhere is safe", "It was my fault"' }],
    },
    {
      id: 'step-2', slot: 'step-2', label: 'Current Sense of Threat', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Intrusions, flashbacks, nightmares, hyperarousal' }],
    },
    {
      id: 'step-3', slot: 'step-3', label: 'Emotional Responses', domain_colour: '#b87090',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Fear, shame, guilt, anger, sadness' }],
    },
    {
      id: 'step-4', slot: 'step-4', label: 'Coping Strategies', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Avoidance, rumination, substance use, thought suppression' }],
    },
  ],
  connections: [
    { from: 'step-0', to: 'step-1', style: 'arrow', direction: 'one_way' },
    { from: 'step-1', to: 'step-2', style: 'arrow', direction: 'one_way' },
    { from: 'step-2', to: 'step-3', style: 'arrow', direction: 'one_way' },
    { from: 'step-3', to: 'step-4', style: 'arrow', direction: 'one_way' },
    { from: 'step-4', to: 'step-0', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
    { from: 'step-4', to: 'step-1', style: 'arrow_dashed', direction: 'one_way', label: 'prevents change' },
  ],
}

// ============================================================================
// 7. OCD Maintenance (Salkovskis 1985)
// ============================================================================

const ocdMaintenance: FormulationTemplate = {
  id: 'tpl-ocd-maintenance',
  name: 'OCD Maintenance Cycle',
  description: 'Salkovskis (1985) OCD maintenance model',
  source: 'Salkovskis (1985)',
  pattern: 'cycle',
  tags: ['CBT', 'OCD', 'cycle', 'maintenance'],
  nodes: [
    {
      id: 'cycle-0', slot: 'cycle-0', label: 'Intrusive Thought / Image', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "What if I left the door unlocked?"' }],
    },
    {
      id: 'cycle-1', slot: 'cycle-1', label: 'Appraisal / Meaning', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "Having this thought means I\'m irresponsible"' }],
    },
    {
      id: 'cycle-2', slot: 'cycle-2', label: 'Distress / Anxiety', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Intense anxiety, guilt, sense of responsibility' }],
    },
    {
      id: 'cycle-3', slot: 'cycle-3', label: 'Compulsion / Neutralising', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Checking door 5 times, seeking reassurance' }],
    },
    {
      id: 'cycle-4', slot: 'cycle-4', label: 'Temporary Relief', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Brief reduction in anxiety, "feels right"' }],
    },
  ],
  connections: [
    { from: 'cycle-0', to: 'cycle-1', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-1', to: 'cycle-2', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-2', to: 'cycle-3', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-3', to: 'cycle-4', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-4', to: 'cycle-0', style: 'arrow_dashed', direction: 'one_way', label: 'reinforces' },
  ],
}

// ============================================================================
// 8. Depression Maintenance (Beck)
// ============================================================================

const depressionMaintenance: FormulationTemplate = {
  id: 'tpl-depression-maintenance',
  name: 'Depression Maintenance',
  description: 'Beck cognitive model of depression maintenance',
  source: 'Beck',
  pattern: 'cross_sectional',
  tags: ['CBT', 'depression', 'maintenance'],
  nodes: [
    {
      id: 'trigger', slot: 'top', label: 'Life Events / Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Argument with partner, being passed over for promotion' }],
    },
    {
      id: 'thoughts', slot: 'left', label: 'Negative Automatic Thoughts', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I\'m useless", "Nothing will ever change", "Nobody cares"' }],
    },
    {
      id: 'mood', slot: 'centre', label: 'Low Mood', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Sad, hopeless, empty, irritable' }],
    },
    {
      id: 'physical', slot: 'right', label: 'Physical Symptoms', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Poor sleep, low energy, appetite changes, aches' }],
    },
    {
      id: 'behaviour', slot: 'bottom', label: 'Withdrawal / Inactivity', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Staying in bed, cancelling plans, stopped exercising' }],
    },
  ],
  connections: [
    { from: 'trigger', to: 'thoughts', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'mood', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'physical', style: 'arrow', direction: 'one_way' },
    { from: 'thoughts', to: 'mood', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'mood', to: 'physical', style: 'arrow', direction: 'both' },
    { from: 'thoughts', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'mood', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'physical', to: 'behaviour', style: 'arrow', direction: 'one_way' },
    { from: 'behaviour', to: 'trigger', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 9. CBT-E Formulation (Fairburn)
// ============================================================================

const cbtEFormulation: FormulationTemplate = {
  id: 'tpl-cbt-e',
  name: 'CBT-E Formulation',
  description: 'Fairburn CBT-E model for eating disorders',
  source: 'Fairburn',
  pattern: 'vertical_flow',
  tags: ['CBT-E', 'eating disorders', 'maintenance'],
  nodes: [
    {
      id: 'step-0', slot: 'step-0', label: 'Core Low Self-Esteem', domain_colour: '#a07850',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "I\'m not good enough", "I\'m worthless"' }],
    },
    {
      id: 'step-1', slot: 'step-1', label: 'Over-Evaluation of Shape & Weight', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "My worth depends on my weight", "I must be thin to be accepted"' }],
    },
    {
      id: 'step-2', slot: 'step-2', label: 'Dietary Restraint / Restriction', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Rigid food rules, calorie counting, skipping meals' }],
    },
    {
      id: 'step-3', slot: 'step-3', label: 'Binge Eating', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Loss of control eating episodes triggered by restriction' }],
    },
    {
      id: 'step-4', slot: 'step-4', label: 'Compensatory Behaviours', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Purging, excessive exercise, laxative use' }],
    },
  ],
  connections: [
    { from: 'step-0', to: 'step-1', style: 'arrow', direction: 'one_way' },
    { from: 'step-1', to: 'step-2', style: 'arrow', direction: 'one_way' },
    { from: 'step-2', to: 'step-3', style: 'arrow', direction: 'one_way' },
    { from: 'step-3', to: 'step-4', style: 'arrow', direction: 'one_way' },
    { from: 'step-4', to: 'step-1', style: 'arrow_dashed', direction: 'one_way', label: 'reinforces' },
  ],
}

// ============================================================================
// 10. CFT Three Systems (Gilbert)
// ============================================================================

const cftThreeSystems: FormulationTemplate = {
  id: 'tpl-cft-three-systems',
  name: 'CFT Three Systems',
  description: 'Gilbert compassion-focused therapy emotion regulation systems',
  source: 'Gilbert',
  pattern: 'three_systems',
  tags: ['CFT', 'compassion', 'three systems', 'emotion regulation'],
  nodes: [
    {
      id: 'system-0', slot: 'system-0', label: 'Threat System', domain_colour: '#c46b6b',
      description: 'Protection and safety-seeking',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Anxiety, anger, disgust — fight/flight/freeze responses' }],
    },
    {
      id: 'system-1', slot: 'system-1', label: 'Drive System', domain_colour: '#5b7fb5',
      description: 'Wanting, pursuing, achieving',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Excitement, motivation — achieve, acquire, consume' }],
    },
    {
      id: 'system-2', slot: 'system-2', label: 'Soothing System', domain_colour: '#6b9e7e',
      description: 'Contentment, safety, connection',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Calm, safe, connected — rest, digest, affiliate' }],
    },
  ],
  connections: [
    { from: 'system-0', to: 'system-1', style: 'arrow', direction: 'both' },
    { from: 'system-1', to: 'system-2', style: 'arrow', direction: 'both' },
    { from: 'system-0', to: 'system-2', style: 'inhibitory', direction: 'one_way' },
  ],
}

// ============================================================================
// 11. Insomnia Maintenance (Espie / Harvey)
// ============================================================================

const insomniaMaintenance: FormulationTemplate = {
  id: 'tpl-insomnia-maintenance',
  name: 'Insomnia Maintenance Cycle',
  description: 'CBT-I sleep maintenance cycle',
  source: 'Espie / Harvey',
  pattern: 'cycle',
  tags: ['CBT-I', 'insomnia', 'sleep', 'cycle'],
  nodes: [
    {
      id: 'cycle-0', slot: 'cycle-0', label: 'Poor Sleep', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Difficulty falling asleep, frequent awakenings, unrefreshing sleep' }],
    },
    {
      id: 'cycle-1', slot: 'cycle-1', label: 'Daytime Fatigue & Worry', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Exhaustion, "I won\'t cope today", dread about tonight' }],
    },
    {
      id: 'cycle-2', slot: 'cycle-2', label: 'Compensatory Behaviours', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Napping, caffeine, going to bed early, lying in, screen use in bed' }],
    },
    {
      id: 'cycle-3', slot: 'cycle-3', label: 'Perpetuating Factors', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Irregular sleep schedule, bed = worry place, reduced sleep drive' }],
    },
  ],
  connections: [
    { from: 'cycle-0', to: 'cycle-1', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-1', to: 'cycle-2', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-2', to: 'cycle-3', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-3', to: 'cycle-0', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 12. Chronic Pain Cycle (Vlaeyen & Linton)
// ============================================================================

const chronicPainCycle: FormulationTemplate = {
  id: 'tpl-chronic-pain',
  name: 'Chronic Pain Fear-Avoidance Cycle',
  description: 'Vlaeyen & Linton fear-avoidance model of chronic pain',
  source: 'Vlaeyen & Linton',
  pattern: 'cycle',
  tags: ['CBT', 'chronic pain', 'fear-avoidance', 'cycle'],
  nodes: [
    {
      id: 'cycle-0', slot: 'cycle-0', label: 'Pain Experience', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Sharp lower back pain when bending' }],
    },
    {
      id: 'cycle-1', slot: 'cycle-1', label: 'Catastrophising / Fear', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. "My back is damaged", "Movement will make it worse"' }],
    },
    {
      id: 'cycle-2', slot: 'cycle-2', label: 'Avoidance / Guarding', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Avoiding bending, stopped exercising, not lifting' }],
    },
    {
      id: 'cycle-3', slot: 'cycle-3', label: 'Deconditioning / Disability', domain_colour: '#6b9e7e',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Muscle weakness, stiffness, reduced mobility, low mood' }],
    },
    {
      id: 'cycle-4', slot: 'cycle-4', label: 'Increased Pain Sensitivity', domain_colour: '#d4a44a',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Lower pain threshold, hypervigilance to body sensations' }],
    },
  ],
  connections: [
    { from: 'cycle-0', to: 'cycle-1', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-1', to: 'cycle-2', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-2', to: 'cycle-3', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-3', to: 'cycle-4', style: 'arrow', direction: 'one_way' },
    { from: 'cycle-4', to: 'cycle-0', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// 13. BDD Maintenance (Veale)
// ============================================================================

const bddMaintenance: FormulationTemplate = {
  id: 'tpl-bdd-maintenance',
  name: 'BDD Maintenance',
  description: 'Veale body dysmorphic disorder maintenance model',
  source: 'Veale',
  pattern: 'cross_sectional',
  tags: ['CBT', 'BDD', 'body image', 'maintenance'],
  nodes: [
    {
      id: 'trigger', slot: 'top', label: 'Trigger', domain_colour: '#8b8e94',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Looking in mirror, someone commenting on appearance' }],
    },
    {
      id: 'beliefs', slot: 'left', label: 'Negative Image & Beliefs', domain_colour: '#5b7fb5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Distorted mental image, "My nose is enormous", "Everyone notices"' }],
    },
    {
      id: 'distress', slot: 'centre', label: 'Distress', domain_colour: '#c46b6b',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Disgust, shame, anxiety, low mood' }],
    },
    {
      id: 'rumination', slot: 'right', label: 'Rumination / Checking', domain_colour: '#d4a44a',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Repeated mirror checking, comparing to others, reassurance seeking' }],
    },
    {
      id: 'avoidance', slot: 'bottom', label: 'Avoidance / Concealment', domain_colour: '#8b7ab5',
      fields: [{ id: 'text', type: 'textarea', placeholder: 'e.g. Wearing hats, avoiding photos, not going out, camouflage make-up' }],
    },
  ],
  connections: [
    { from: 'trigger', to: 'beliefs', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'distress', style: 'arrow', direction: 'one_way' },
    { from: 'trigger', to: 'rumination', style: 'arrow', direction: 'one_way' },
    { from: 'beliefs', to: 'distress', style: 'arrow', direction: 'both' },
    { from: 'beliefs', to: 'rumination', style: 'arrow', direction: 'both' },
    { from: 'distress', to: 'rumination', style: 'arrow', direction: 'both' },
    { from: 'beliefs', to: 'avoidance', style: 'arrow', direction: 'one_way' },
    { from: 'distress', to: 'avoidance', style: 'arrow', direction: 'one_way' },
    { from: 'rumination', to: 'avoidance', style: 'arrow', direction: 'one_way' },
    { from: 'avoidance', to: 'trigger', style: 'arrow_dashed', direction: 'one_way', label: 'maintains' },
  ],
}

// ============================================================================
// Exported collection
// ============================================================================

export const FORMULATION_TEMPLATES: FormulationTemplate[] = [
  genericFiveAreas,
  healthAnxiety,
  panicCycle,
  socialAnxiety,
  gadMetacognitive,
  ptsdEhlersClark,
  ocdMaintenance,
  depressionMaintenance,
  cbtEFormulation,
  cftThreeSystems,
  insomniaMaintenance,
  chronicPainCycle,
  bddMaintenance,
]

/** Grouped by pattern for the template picker UI */
export const TEMPLATES_BY_PATTERN: Record<FormulationLayoutPattern, FormulationTemplate[]> = {
  cross_sectional: FORMULATION_TEMPLATES.filter(t => t.pattern === 'cross_sectional'),
  radial: FORMULATION_TEMPLATES.filter(t => t.pattern === 'radial'),
  vertical_flow: FORMULATION_TEMPLATES.filter(t => t.pattern === 'vertical_flow'),
  cycle: FORMULATION_TEMPLATES.filter(t => t.pattern === 'cycle'),
  three_systems: FORMULATION_TEMPLATES.filter(t => t.pattern === 'three_systems'),
}
