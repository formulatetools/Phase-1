-- Formulate: Worksheet Library Seed (LEGACY)
-- ============================================================================
-- DEPRECATED: This file is superseded by migrations 00021–00024 which contain
-- the full 118-worksheet library with portable SELECT-based category lookups.
--
-- This file uses hardcoded production category UUIDs and will NOT work in
-- fresh environments. It is kept for reference only.
--
-- Worksheets overwritten by migration 00021 (Batch 1):
--   behavioural-experiment-planner, relapse-prevention-plan,
--   depression-formulation, ocd-vicious-flower-formulation,
--   panic-diary, positive-data-log
--
-- Worksheets overwritten by migration 00022 (Batch 2):
--   Check 00022 crosswalk section for details.
--
-- DO NOT run this file against a database that has migrations 00021+ applied.
-- ============================================================================
-- Evidence-based CBT worksheets across all categories
-- Uses existing category IDs from production database

-- ============================================================================
-- GENERAL CBT SKILLS (46b771b7-fd91-4e31-9ad9-4481ed516c28)
-- Already has: 5-Column Thought Record
-- ============================================================================

-- 7-Column Thought Record (Extended)
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  '7-Column Thought Record',
  '7-column-thought-record',
  'The full extended thought record with evidence for and against, balanced thought, and re-rating of emotion.',
  'When you notice a shift in your mood, complete each column working left to right. Start with the situation, then identify the emotion and hot thought. Gather evidence for and against the hot thought before constructing a more balanced perspective.',
  '{"version":1,"sections":[{"id":"situation","title":"Situation","description":"What happened? Where were you? Who were you with?","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"situation","type":"textarea","label":"Describe the situation","required":true,"placeholder":"What were you doing? Where were you? Who was there?"}]},{"id":"emotions","title":"Emotions","description":"What did you feel? Rate each emotion 0–100%.","fields":[{"id":"emotions_table","type":"table","label":"Emotions and intensity","columns":[{"id":"emotion","header":"Emotion","type":"text"},{"id":"intensity","header":"Intensity (0–100%)","type":"number","min":0,"max":100}],"min_rows":1,"max_rows":5}]},{"id":"hot_thought","title":"Hot Thought","description":"What was the most distressing thought going through your mind?","fields":[{"id":"hot_thought","type":"textarea","label":"Hot thought (automatic thought)","required":true,"placeholder":"What went through your mind? What did the situation mean to you?"},{"id":"belief_rating","type":"likert","label":"How much do you believe this thought?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}}]},{"id":"evidence_for","title":"Evidence For","description":"What evidence supports this thought? Stick to facts, not feelings.","fields":[{"id":"evidence_for","type":"textarea","label":"Evidence that supports the hot thought","placeholder":"What facts support this thought? What have you observed?"}]},{"id":"evidence_against","title":"Evidence Against","description":"What evidence does NOT support this thought?","fields":[{"id":"evidence_against","type":"textarea","label":"Evidence that does not support the hot thought","placeholder":"What facts contradict this thought? What would you say to a friend? Have there been times when this wasn''t true?"}]},{"id":"balanced","title":"Balanced Thought","description":"Having weighed the evidence, what is a more balanced way of thinking?","fields":[{"id":"balanced_thought","type":"textarea","label":"Balanced / alternative thought","required":true,"placeholder":"Write a thought that takes into account both the evidence for and against."},{"id":"balanced_belief","type":"likert","label":"How much do you believe the balanced thought?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}}]},{"id":"outcome","title":"Outcome","description":"Re-rate your original emotions now.","fields":[{"id":"outcome_emotions","type":"table","label":"Re-rate emotions","columns":[{"id":"emotion","header":"Emotion","type":"text"},{"id":"intensity","header":"Intensity now (0–100%)","type":"number","min":0,"max":100}],"min_rows":1,"max_rows":5}]}]}',
  true, false,
  ARRAY['cognitive restructuring', 'thought records', 'CBT', 'automatic thoughts', 'balanced thinking'],
  20, 2
);

-- Cognitive Distortions Checklist
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  'Cognitive Distortions Checklist',
  'cognitive-distortions-checklist',
  'Identify common thinking errors (cognitive distortions) present in your automatic thoughts.',
  'Think about a recent automatic thought that caused distress. Review the list of cognitive distortions below and tick any that apply to your thought. Then try to reframe the thought without the distortion.',
  '{"version":1,"sections":[{"id":"thought","title":"The Thought","fields":[{"id":"situation","type":"textarea","label":"Situation","placeholder":"Briefly describe what happened"},{"id":"automatic_thought","type":"textarea","label":"Automatic thought","required":true,"placeholder":"What went through your mind?"}]},{"id":"distortions","title":"Which Distortions Apply?","description":"Tick all that apply to your automatic thought.","fields":[{"id":"distortions_list","type":"checklist","label":"Cognitive distortions","options":[{"id":"all_or_nothing","label":"All-or-nothing thinking — Seeing things in black and white, no middle ground"},{"id":"catastrophising","label":"Catastrophising — Jumping to the worst-case scenario"},{"id":"mind_reading","label":"Mind reading — Assuming you know what others are thinking"},{"id":"fortune_telling","label":"Fortune telling — Predicting the future negatively"},{"id":"mental_filter","label":"Mental filter — Focusing only on the negative and ignoring positives"},{"id":"disqualifying","label":"Disqualifying the positive — Dismissing good things as not counting"},{"id":"should_statements","label":"Should statements — Rigid rules about how things must be"},{"id":"labelling","label":"Labelling — Attaching a fixed label to yourself or others"},{"id":"personalisation","label":"Personalisation — Blaming yourself for things outside your control"},{"id":"overgeneralisation","label":"Overgeneralisation — Drawing broad conclusions from a single event"},{"id":"magnification","label":"Magnification / minimisation — Blowing things up or shrinking them"},{"id":"emotional_reasoning","label":"Emotional reasoning — Assuming feelings reflect facts (I feel it, so it must be true)"}]}]},{"id":"reframe","title":"Reframe","description":"Now try restating the thought without the distortion.","fields":[{"id":"reframed_thought","type":"textarea","label":"Reframed thought","placeholder":"How could you think about this differently, without the distortion?"},{"id":"distress_before","type":"likert","label":"Distress before reframing","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}},{"id":"distress_after","type":"likert","label":"Distress after reframing","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}}]}]}',
  true, false,
  ARRAY['cognitive distortions', 'thinking errors', 'CBT', 'psychoeducation'],
  15, 3
);

-- Behavioural Experiment Planner
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  'Behavioural Experiment Planner',
  'behavioural-experiment-planner',
  'Plan and review a behavioural experiment to test a belief or prediction.',
  'Use this worksheet to design an experiment that tests one of your negative predictions or beliefs. Complete the planning section before the experiment, then fill in the results section afterwards.',
  '{"version":1,"sections":[{"id":"belief","title":"The Belief to Test","fields":[{"id":"belief","type":"textarea","label":"What belief or prediction are you testing?","required":true,"placeholder":"e.g. If I speak up in the meeting, everyone will think I''m stupid"},{"id":"belief_strength","type":"likert","label":"How strongly do you believe this? (before experiment)","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}}]},{"id":"plan","title":"Experiment Plan","fields":[{"id":"experiment","type":"textarea","label":"What will you do?","required":true,"placeholder":"Describe the specific experiment you will carry out"},{"id":"when","type":"text","label":"When will you do it?","placeholder":"e.g. Tuesday''s team meeting"},{"id":"predicted_outcome","type":"textarea","label":"What do you predict will happen?","placeholder":"Be specific — what exactly do you expect?"},{"id":"safety_behaviours","type":"textarea","label":"What safety behaviours will you try to drop?","placeholder":"e.g. Rehearsing what to say, avoiding eye contact"}]},{"id":"results","title":"Results (complete after the experiment)","fields":[{"id":"what_happened","type":"textarea","label":"What actually happened?","placeholder":"Describe what occurred as factually as possible"},{"id":"what_learned","type":"textarea","label":"What did you learn?","placeholder":"How does this compare to your prediction?"},{"id":"belief_strength_after","type":"likert","label":"How strongly do you believe the original thought now?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}},{"id":"next_steps","type":"textarea","label":"What would you like to try next?","placeholder":"Any follow-up experiments or new beliefs to test?"}]}]}',
  true, false,
  ARRAY['behavioural experiments', 'CBT', 'belief testing', 'predictions'],
  15, 4
);

-- Values Assessment
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  'Values Assessment',
  'values-assessment',
  'Explore what matters most to you across key life domains to guide goal-setting and behavioural activation.',
  'Rate how important each life domain is to you, then rate how consistent your current actions are with each value. Use this to identify areas where you might want to make changes.',
  '{"version":1,"sections":[{"id":"values","title":"Life Domains","description":"For each domain, rate its importance to you and how well your current life reflects this value.","fields":[{"id":"values_table","type":"table","label":"Values by life domain","columns":[{"id":"domain","header":"Life Domain","type":"text"},{"id":"importance","header":"Importance (0–10)","type":"number","min":0,"max":10},{"id":"consistency","header":"Current Consistency (0–10)","type":"number","min":0,"max":10},{"id":"notes","header":"What would living this value look like?","type":"text"}],"min_rows":8,"max_rows":12}]},{"id":"priorities","title":"Priorities","description":"Based on your ratings, which areas have the biggest gap between importance and consistency?","fields":[{"id":"top_priorities","type":"textarea","label":"Top 2–3 values to focus on","placeholder":"Which values feel most important to work on right now?"},{"id":"small_steps","type":"textarea","label":"Small steps you could take this week","placeholder":"What is one small action you could take in each priority area?"}]}]}',
  true, false,
  ARRAY['values', 'ACT', 'motivation', 'goals', 'behavioural activation'],
  20, 5
);

-- Relapse Prevention Plan
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '46b771b7-fd91-4e31-9ad9-4481ed516c28',
  'Relapse Prevention Plan',
  'relapse-prevention-plan',
  'Create a personalised plan for maintaining progress and managing setbacks after therapy ends.',
  'Work through each section to build your personal relapse prevention blueprint. This is your toolkit for when therapy ends — keep it somewhere accessible.',
  '{"version":1,"sections":[{"id":"progress","title":"What I Have Learned","fields":[{"id":"key_insights","type":"textarea","label":"Key insights from therapy","required":true,"placeholder":"What are the most important things you''ve learned about yourself and your difficulties?"},{"id":"helpful_strategies","type":"textarea","label":"Strategies that helped most","placeholder":"Which techniques or approaches made the biggest difference?"}]},{"id":"warning_signs","title":"Early Warning Signs","description":"What are the first signs that things might be slipping?","fields":[{"id":"warning_signs","type":"checklist","label":"My early warning signs","options":[{"id":"sleep","label":"Changes in sleep (too much or too little)"},{"id":"withdrawal","label":"Withdrawing from people or activities"},{"id":"negative_thinking","label":"Increase in negative thinking"},{"id":"avoidance","label":"Avoiding situations I used to manage"},{"id":"irritability","label":"Increased irritability or frustration"},{"id":"appetite","label":"Changes in appetite"},{"id":"motivation","label":"Loss of motivation or interest"},{"id":"safety_behaviours","label":"Return of old safety behaviours or rituals"}]},{"id":"personal_signs","type":"textarea","label":"My personal warning signs","placeholder":"Any other signs specific to you"}]},{"id":"action_plan","title":"Action Plan","description":"What will you do if you notice warning signs?","fields":[{"id":"immediate_steps","type":"textarea","label":"Immediate steps I can take","required":true,"placeholder":"e.g. Use my thought record, schedule an activity, call a friend"},{"id":"support_people","type":"textarea","label":"People I can reach out to","placeholder":"Who can support you? Include names and how to contact them"},{"id":"professional_help","type":"textarea","label":"When and how to seek professional help","placeholder":"At what point would you contact your GP or self-refer back to therapy?"}]},{"id":"maintenance","title":"Ongoing Maintenance","fields":[{"id":"regular_practices","type":"textarea","label":"Things I will keep doing regularly","placeholder":"e.g. Weekly activity scheduling, daily mindfulness, thought records when needed"},{"id":"goals","type":"textarea","label":"Ongoing goals","placeholder":"What do you want to keep working towards?"}]}]}',
  true, false,
  ARRAY['relapse prevention', 'maintenance', 'ending therapy', 'CBT'],
  25, 6
);

-- ============================================================================
-- DEPRESSION (0fa9fd47-7185-471f-a096-870c9231f843)
-- Already has: Behavioural Activation Activity Schedule
-- ============================================================================

-- Activity & Mood Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '0fa9fd47-7185-471f-a096-870c9231f843',
  'Activity & Mood Diary',
  'activity-mood-diary',
  'Track your daily activities alongside your mood to identify patterns between what you do and how you feel.',
  'At the end of each day (or throughout the day), record what you did and rate your mood. Look for patterns — which activities lift your mood? Which ones bring it down?',
  '{"version":1,"sections":[{"id":"diary","title":"Daily Activity & Mood Log","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"entries","type":"table","label":"Activities throughout the day","columns":[{"id":"time","header":"Time","type":"text"},{"id":"activity","header":"Activity","type":"text"},{"id":"mood","header":"Mood (0–10)","type":"number","min":0,"max":10},{"id":"pleasure","header":"Pleasure (0–10)","type":"number","min":0,"max":10},{"id":"mastery","header":"Mastery (0–10)","type":"number","min":0,"max":10}],"min_rows":6,"max_rows":12}]},{"id":"reflection","title":"Reflection","fields":[{"id":"overall_mood","type":"likert","label":"Overall mood today","min":0,"max":10,"step":1,"anchors":{"0":"Very low","5":"Neutral","10":"Very good"}},{"id":"patterns","type":"textarea","label":"What did you notice?","placeholder":"Any patterns between activities and mood? What helped? What didn''t?"},{"id":"plan_tomorrow","type":"textarea","label":"One thing to plan for tomorrow","placeholder":"Based on today, is there an activity you could schedule for tomorrow?"}]}]}',
  true, false,
  ARRAY['depression', 'mood diary', 'behavioural activation', 'activity monitoring'],
  10, 2
);

-- Depression Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '0fa9fd47-7185-471f-a096-870c9231f843',
  'Depression Formulation',
  'depression-formulation',
  'A guided formulation based on Beck''s cognitive model of depression, linking early experiences to current maintaining cycles.',
  'Work through each section to build an understanding of how your depression developed and what keeps it going. This is a collaborative tool — discuss it with your therapist.',
  '{"version":1,"sections":[{"id":"early","title":"Early Experiences","description":"What experiences shaped how you see yourself, others, and the world?","fields":[{"id":"early_experiences","type":"textarea","label":"Key early experiences","placeholder":"e.g. Critical parent, bullying, loss, high expectations"}]},{"id":"beliefs","title":"Core Beliefs & Rules","fields":[{"id":"core_beliefs","type":"textarea","label":"Core beliefs about yourself","placeholder":"e.g. I''m not good enough, I''m unlovable, I''m a failure"},{"id":"rules","type":"textarea","label":"Rules and assumptions","placeholder":"e.g. If I don''t do everything perfectly, people will reject me"}]},{"id":"trigger","title":"Current Trigger","fields":[{"id":"trigger","type":"textarea","label":"What triggered the current episode?","placeholder":"What situation or event activated these beliefs?"}]},{"id":"cycle","title":"Maintaining Cycle","description":"How do thoughts, feelings, behaviours, and physical symptoms keep the depression going?","fields":[{"id":"thoughts","type":"textarea","label":"Negative automatic thoughts","placeholder":"e.g. Nothing will ever change, What''s the point?"},{"id":"emotions","type":"textarea","label":"Emotions","placeholder":"e.g. Sadness, hopelessness, guilt, numbness"},{"id":"behaviours","type":"textarea","label":"Behaviours","placeholder":"e.g. Withdrawal, staying in bed, cancelling plans, ruminating"},{"id":"physical","type":"textarea","label":"Physical symptoms","placeholder":"e.g. Fatigue, poor sleep, appetite changes, heaviness"}]}]}',
  true, false,
  ARRAY['depression', 'formulation', 'Beck', 'cognitive model', 'case conceptualisation'],
  20, 3
);

-- ============================================================================
-- GAD (7595b42f-c4aa-467b-8588-1c62e160008a)
-- ============================================================================

-- Worry Log
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '7595b42f-c4aa-467b-8588-1c62e160008a',
  'Worry Log',
  'worry-log',
  'Record your worries to identify patterns, distinguish between practical and hypothetical worries, and practise worry postponement.',
  'Each time you notice yourself worrying, briefly log it here. Classify it as a practical worry (something you can act on now) or a hypothetical worry (a "what if" you can''t solve right now). Try to postpone hypothetical worries to your designated worry time.',
  '{"version":1,"sections":[{"id":"log","title":"Worry Log","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"worries","type":"table","label":"Worries recorded today","columns":[{"id":"time","header":"Time","type":"text"},{"id":"worry","header":"What were you worrying about?","type":"text"},{"id":"type","header":"Type (P = Practical, H = Hypothetical)","type":"text"},{"id":"intensity","header":"Intensity (0–10)","type":"number","min":0,"max":10},{"id":"action","header":"What did you do?","type":"text"}],"min_rows":3,"max_rows":10}]},{"id":"reflection","title":"End of Day Reflection","fields":[{"id":"worry_time_used","type":"select","label":"Did you use your worry time today?","options":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"},{"id":"na","label":"Not scheduled today"}]},{"id":"patterns","type":"textarea","label":"What patterns did you notice?","placeholder":"Were most worries practical or hypothetical? Any themes?"},{"id":"helpful","type":"textarea","label":"What helped manage the worry?","placeholder":"e.g. Postponing it, problem-solving, accepting uncertainty"}]}]}',
  true, false,
  ARRAY['worry', 'GAD', 'anxiety', 'worry postponement', 'monitoring'],
  10, 1
);

-- Worry Decision Tree
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '7595b42f-c4aa-467b-8588-1c62e160008a',
  'Worry Decision Tree',
  'worry-decision-tree',
  'Work through a structured process to decide whether a worry is practical (take action) or hypothetical (practise letting go).',
  'Start with your worry and work through each question. This helps you decide whether to problem-solve or to practise accepting uncertainty.',
  '{"version":1,"sections":[{"id":"worry","title":"The Worry","fields":[{"id":"worry","type":"textarea","label":"What are you worrying about?","required":true,"placeholder":"Write the worry out in full"},{"id":"distress","type":"likert","label":"How distressed are you?","min":0,"max":10,"step":1,"anchors":{"0":"Not at all","5":"Moderately","10":"Extremely"}}]},{"id":"classify","title":"Is This Worry Practical?","description":"Can you do something about this right now?","fields":[{"id":"is_practical","type":"select","label":"Is there a concrete action you can take right now?","options":[{"id":"yes","label":"Yes — this is something I can act on"},{"id":"no","label":"No — this is a ''what if'' or about the future"},{"id":"unsure","label":"I''m not sure"}]},{"id":"happening_now","type":"select","label":"Is this happening now or is it about a future possibility?","options":[{"id":"now","label":"Happening now or very soon"},{"id":"future","label":"A future possibility / ''what if''"}]}]},{"id":"practical_path","title":"If Practical: Problem-Solve","description":"Only complete this section if the worry is practical.","fields":[{"id":"problem","type":"textarea","label":"Define the specific problem","placeholder":"What exactly needs solving?"},{"id":"solutions","type":"textarea","label":"List possible solutions","placeholder":"Brainstorm without judging — write all options"},{"id":"chosen_action","type":"textarea","label":"Chosen action and when","placeholder":"What will you do, and when?"}]},{"id":"hypothetical_path","title":"If Hypothetical: Let Go","description":"Only complete this section if the worry is hypothetical.","fields":[{"id":"uncertainty","type":"textarea","label":"What uncertainty are you struggling to accept?","placeholder":"What is the unknown that is bothering you?"},{"id":"letting_go","type":"textarea","label":"What would you say to a friend with this worry?","placeholder":"How would you help them accept the uncertainty?"},{"id":"refocus","type":"textarea","label":"What can you refocus your attention on?","placeholder":"What meaningful activity can you engage with right now?"}]}]}',
  true, false,
  ARRAY['worry', 'GAD', 'problem-solving', 'uncertainty', 'decision tree'],
  15, 2
);

-- Intolerance of Uncertainty Scale
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '7595b42f-c4aa-467b-8588-1c62e160008a',
  'Tolerating Uncertainty Practice',
  'tolerating-uncertainty-practice',
  'Practise noticing and tolerating everyday uncertainty to build your tolerance muscle.',
  'Each day, identify one moment of uncertainty and practise sitting with it rather than seeking reassurance or trying to resolve it.',
  '{"version":1,"sections":[{"id":"practice","title":"Uncertainty Practice","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"situation","type":"textarea","label":"What was the uncertain situation?","required":true,"placeholder":"e.g. Sent a text and didn''t get a reply, waiting for test results"},{"id":"urge","type":"textarea","label":"What was your urge? (to check, seek reassurance, plan, etc.)","placeholder":"What did you want to do to make the uncertainty go away?"},{"id":"what_you_did","type":"textarea","label":"What did you actually do?","placeholder":"Did you sit with it, or give in to the urge?"},{"id":"discomfort_peak","type":"likert","label":"Peak discomfort","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}},{"id":"discomfort_after","type":"likert","label":"Discomfort after 30 minutes","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}},{"id":"learning","type":"textarea","label":"What did you learn?","placeholder":"Did the discomfort pass? Was the outcome as bad as feared?"}]}]}',
  true, false,
  ARRAY['uncertainty', 'GAD', 'anxiety', 'tolerance', 'exposure'],
  10, 3
);

-- ============================================================================
-- OCD (07036cf2-914a-4bd8-b0bc-066a69ef1c8c)
-- Already has: ERP Hierarchy Builder
-- ============================================================================

-- OCD Vicious Flower Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '07036cf2-914a-4bd8-b0bc-066a69ef1c8c',
  'OCD Formulation (Vicious Flower)',
  'ocd-vicious-flower-formulation',
  'Map out the OCD cycle using the vicious flower model: intrusion, appraisal, emotion, and maintaining responses.',
  'Start with the intrusive thought at the centre, then work outwards to map how you interpret it, how it makes you feel, and what you do in response. This shows how responses feed back into the cycle.',
  '{"version":1,"sections":[{"id":"intrusion","title":"Intrusive Thought / Image / Urge","description":"The unwanted thought, image, or urge that keeps coming back.","fields":[{"id":"intrusion","type":"textarea","label":"What is the intrusion?","required":true,"placeholder":"e.g. Image of harming someone, thought about contamination, doubt about the door being locked"}]},{"id":"appraisal","title":"Appraisal (What It Means to You)","description":"How do you interpret this intrusion? Why does it bother you?","fields":[{"id":"meaning","type":"textarea","label":"What does this thought mean to you?","required":true,"placeholder":"e.g. Having this thought means I''m dangerous, If I don''t check something bad will happen"},{"id":"beliefs","type":"checklist","label":"Which beliefs are involved?","options":[{"id":"responsibility","label":"Inflated responsibility — I must prevent harm"},{"id":"overimportance","label":"Over-importance of thoughts — Thinking it is as bad as doing it"},{"id":"control","label":"Need to control thoughts — I should be able to stop this thought"},{"id":"overestimate_threat","label":"Overestimation of threat — The worst outcome is very likely"},{"id":"perfectionism","label":"Perfectionism — I must get this exactly right"},{"id":"intolerance_uncertainty","label":"Intolerance of uncertainty — I need to know for certain"}]}]},{"id":"emotions","title":"Emotions & Physical Sensations","fields":[{"id":"emotions","type":"textarea","label":"What do you feel?","placeholder":"e.g. Anxiety, disgust, guilt, dread"},{"id":"physical","type":"textarea","label":"Physical sensations","placeholder":"e.g. Tension, nausea, racing heart, sweating"}]},{"id":"responses","title":"Responses (Compulsions & Avoidance)","description":"What do you do to reduce the distress? These maintain the cycle.","fields":[{"id":"compulsions","type":"textarea","label":"Compulsions / rituals","placeholder":"e.g. Checking, washing, counting, mental reviewing, seeking reassurance"},{"id":"avoidance","type":"textarea","label":"Avoidance","placeholder":"e.g. Avoiding knives, certain places, being alone with children"},{"id":"neutralising","type":"textarea","label":"Neutralising / mental rituals","placeholder":"e.g. Replacing bad thought with good one, praying, mental checking"}]}]}',
  true, false,
  ARRAY['OCD', 'formulation', 'vicious flower', 'cognitive model', 'intrusions'],
  20, 2
);

-- ERP Practice Record
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '07036cf2-914a-4bd8-b0bc-066a69ef1c8c',
  'ERP Practice Record',
  'erp-practice-record',
  'Record the details and outcome of an individual exposure and response prevention practice.',
  'Complete this after each ERP practice. Record what you did, your anxiety levels, and what you learned. Over time you will see your anxiety decreasing.',
  '{"version":1,"sections":[{"id":"setup","title":"Exposure Details","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"exposure","type":"textarea","label":"What was the exposure?","required":true,"placeholder":"Describe exactly what you did"},{"id":"target_compulsion","type":"textarea","label":"What compulsion/avoidance did you resist?","placeholder":"What would you normally do that you didn''t do?"}]},{"id":"anxiety","title":"Anxiety Ratings","fields":[{"id":"suds_before","type":"likert","label":"SUDS before exposure","min":0,"max":100,"step":5,"anchors":{"0":"No anxiety","25":"Mild","50":"Moderate","75":"Severe","100":"Extreme"}},{"id":"suds_peak","type":"likert","label":"Peak SUDS during exposure","min":0,"max":100,"step":5,"anchors":{"0":"No anxiety","25":"Mild","50":"Moderate","75":"Severe","100":"Extreme"}},{"id":"suds_end","type":"likert","label":"SUDS at end of exposure","min":0,"max":100,"step":5,"anchors":{"0":"No anxiety","25":"Mild","50":"Moderate","75":"Severe","100":"Extreme"}},{"id":"duration","type":"text","label":"How long did you stay in the situation?","placeholder":"e.g. 20 minutes"}]},{"id":"reflection","title":"Reflection","fields":[{"id":"what_happened","type":"textarea","label":"What actually happened?","placeholder":"Did the feared outcome occur?"},{"id":"what_learned","type":"textarea","label":"What did you learn?","placeholder":"What does this tell you about your OCD predictions?"},{"id":"next_time","type":"textarea","label":"What will you do differently next time?","placeholder":"Any adjustments for next practice?"}]}]}',
  true, false,
  ARRAY['ERP', 'exposure', 'OCD', 'response prevention', 'SUDS', 'practice'],
  10, 3
);

-- ============================================================================
-- SOCIAL ANXIETY (32055444-3abf-4679-9694-00510ed28618)
-- ============================================================================

-- Social Situation Record
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '32055444-3abf-4679-9694-00510ed28618',
  'Social Situation Record',
  'social-situation-record',
  'Record and reflect on social situations to identify the role of self-focused attention, safety behaviours, and predictions.',
  'Complete this after a social situation that caused anxiety. Focus on what you predicted would happen vs. what actually happened, and what safety behaviours you used.',
  '{"version":1,"sections":[{"id":"situation","title":"The Situation","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"situation","type":"textarea","label":"Describe the social situation","required":true,"placeholder":"What happened? Who was there? What were you doing?"},{"id":"anxiety_before","type":"likert","label":"Anxiety before (0–100)","min":0,"max":100,"step":5,"anchors":{"0":"None","50":"Moderate","100":"Extreme"}}]},{"id":"predictions","title":"Predictions & Self-Image","fields":[{"id":"prediction","type":"textarea","label":"What did you predict would happen?","required":true,"placeholder":"e.g. I''ll go red, I''ll say something stupid, people will judge me"},{"id":"self_image","type":"textarea","label":"How did you see yourself? (your mental image)","placeholder":"Describe the impression you thought you were giving to others"},{"id":"self_focus","type":"likert","label":"How self-focused were you? (attention on yourself vs. the task)","min":0,"max":10,"step":1,"anchors":{"0":"Fully on task/others","5":"50/50","10":"Entirely on myself"}}]},{"id":"safety","title":"Safety Behaviours","description":"What did you do to try to prevent your feared outcome?","fields":[{"id":"safety_behaviours","type":"checklist","label":"Safety behaviours used","options":[{"id":"rehearsing","label":"Rehearsing what to say"},{"id":"avoid_eye_contact","label":"Avoiding eye contact"},{"id":"speaking_quietly","label":"Speaking quietly or briefly"},{"id":"hiding","label":"Hiding signs of anxiety (gripping hands, wearing layers)"},{"id":"avoiding_attention","label":"Trying not to draw attention"},{"id":"drink","label":"Holding a drink / keeping hands busy"},{"id":"escaping","label":"Leaving early or staying on the edge"},{"id":"phone","label":"Looking at phone to avoid interaction"}]},{"id":"other_safety","type":"textarea","label":"Other safety behaviours","placeholder":"Any others not listed above?"}]},{"id":"outcome","title":"What Actually Happened?","fields":[{"id":"actual_outcome","type":"textarea","label":"What actually happened?","required":true,"placeholder":"Was your prediction accurate? What did you observe?"},{"id":"evidence_against","type":"textarea","label":"Evidence that your prediction was wrong","placeholder":"What suggests it didn''t go as badly as you feared?"},{"id":"anxiety_after","type":"likert","label":"Anxiety after reflecting (0–100)","min":0,"max":100,"step":5,"anchors":{"0":"None","50":"Moderate","100":"Extreme"}}]}]}',
  true, false,
  ARRAY['social anxiety', 'safety behaviours', 'self-focused attention', 'predictions'],
  15, 1
);

-- ============================================================================
-- HEALTH ANXIETY (c6057be4-2816-449b-91d8-1c9f0f4b29ab)
-- ============================================================================

-- Health Anxiety Monitoring Log
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  'c6057be4-2816-449b-91d8-1c9f0f4b29ab',
  'Health Anxiety Monitoring Log',
  'health-anxiety-monitoring-log',
  'Track health-related worries, body checking, and reassurance-seeking to identify patterns.',
  'Each time you notice health anxiety, record the trigger, what you feared, and how you responded. Over time this helps you see patterns and reduce checking behaviours.',
  '{"version":1,"sections":[{"id":"log","title":"Health Anxiety Log","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"entries","type":"table","label":"Health anxiety episodes","columns":[{"id":"trigger","header":"Trigger (symptom / news / thought)","type":"text"},{"id":"feared_illness","header":"What did you fear?","type":"text"},{"id":"anxiety","header":"Anxiety (0–10)","type":"number","min":0,"max":10},{"id":"response","header":"What did you do? (check / Google / GP / nothing)","type":"text"},{"id":"result","header":"Did checking help or make it worse?","type":"text"}],"min_rows":3,"max_rows":8}]},{"id":"reflection","title":"Reflection","fields":[{"id":"checking_count","type":"number","label":"How many times did you body-check today?","min":0,"max":100},{"id":"reassurance_count","type":"number","label":"How many times did you seek reassurance?","min":0,"max":100},{"id":"pattern","type":"textarea","label":"What patterns do you notice?","placeholder":"Does checking reduce anxiety long-term or increase it?"}]}]}',
  true, false,
  ARRAY['health anxiety', 'monitoring', 'body checking', 'reassurance', 'hypochondriasis'],
  10, 1
);

-- ============================================================================
-- PANIC DISORDER (c81a19c8-9510-4efe-81b6-5449c0f89ecd)
-- ============================================================================

-- Panic Diary
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  'c81a19c8-9510-4efe-81b6-5449c0f89ecd',
  'Panic Diary',
  'panic-diary',
  'Record panic attacks to identify triggers, misinterpretations of bodily sensations, and safety behaviours that maintain the cycle.',
  'Complete this as soon as possible after a panic attack or a period of heightened anxiety. Focus on the bodily sensations and what you thought they meant.',
  '{"version":1,"sections":[{"id":"episode","title":"Panic Episode","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"time","type":"time","label":"Time"},{"id":"situation","type":"textarea","label":"Where were you? What were you doing?","required":true,"placeholder":"Describe the situation when the panic started"},{"id":"peak_intensity","type":"likert","label":"Peak intensity (0–100)","min":0,"max":100,"step":5,"anchors":{"0":"Mild anxiety","50":"Moderate panic","100":"Worst panic imaginable"}}]},{"id":"sensations","title":"Bodily Sensations","description":"What physical sensations did you notice?","fields":[{"id":"sensations","type":"checklist","label":"Physical symptoms","options":[{"id":"heart_racing","label":"Heart racing or pounding"},{"id":"chest_pain","label":"Chest pain or tightness"},{"id":"breathing","label":"Shortness of breath or hyperventilation"},{"id":"dizziness","label":"Dizziness or lightheadedness"},{"id":"tingling","label":"Tingling or numbness"},{"id":"sweating","label":"Sweating"},{"id":"trembling","label":"Trembling or shaking"},{"id":"nausea","label":"Nausea or stomach churning"},{"id":"hot_cold","label":"Hot flushes or chills"},{"id":"unreality","label":"Feeling unreal or detached"}]},{"id":"other_sensations","type":"textarea","label":"Other sensations","placeholder":"Any other physical symptoms?"}]},{"id":"interpretation","title":"Interpretation","description":"What did you think the sensations meant?","fields":[{"id":"catastrophic_thought","type":"textarea","label":"What was your catastrophic interpretation?","required":true,"placeholder":"e.g. I''m having a heart attack, I''m going to faint, I''m going mad, I''m going to lose control"},{"id":"belief_rating","type":"likert","label":"How much did you believe this at the time?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}}]},{"id":"response","title":"What Did You Do?","fields":[{"id":"safety_behaviours","type":"textarea","label":"Safety behaviours used","placeholder":"e.g. Sat down, left the situation, called someone, focused on breathing"},{"id":"how_it_ended","type":"textarea","label":"How did the panic end?","placeholder":"What happened? How long did it last?"},{"id":"alternative","type":"textarea","label":"Alternative explanation for the sensations","placeholder":"Is there a non-catastrophic explanation? (e.g. adrenaline response, normal anxiety)"}]}]}',
  true, false,
  ARRAY['panic', 'panic attacks', 'catastrophic misinterpretation', 'safety behaviours', 'bodily sensations'],
  15, 1
);

-- ============================================================================
-- PTSD / TRAUMA (e41ca277-e28a-4b03-b772-c1ae3f3eedd9)
-- ============================================================================

-- Trauma Impact Statement
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  'e41ca277-e28a-4b03-b772-c1ae3f3eedd9',
  'Trauma Impact Statement',
  'trauma-impact-statement',
  'Explore how the traumatic event has affected your beliefs about yourself, others, and the world.',
  'Write freely about how the trauma has impacted different areas of your life. There are no right or wrong answers — this is about understanding the meaning the event holds for you.',
  '{"version":1,"sections":[{"id":"impact","title":"Impact on Beliefs","description":"How has the trauma changed how you see yourself, others, and the world?","fields":[{"id":"self","type":"textarea","label":"Beliefs about yourself","required":true,"placeholder":"How do you see yourself since the trauma? Has it changed how you think about your worth, strength, or identity?"},{"id":"others","type":"textarea","label":"Beliefs about other people","placeholder":"Has the trauma changed how you see other people? Trust, safety, intentions?"},{"id":"world","type":"textarea","label":"Beliefs about the world","placeholder":"Has it changed how you see the world? Safety, fairness, predictability?"}]},{"id":"domains","title":"Impact on Life Areas","fields":[{"id":"areas","type":"table","label":"Life areas affected","columns":[{"id":"area","header":"Life Area","type":"text"},{"id":"before","header":"Before the trauma","type":"text"},{"id":"after","header":"After the trauma","type":"text"}],"min_rows":4,"max_rows":8}]},{"id":"meaning","title":"Meaning","fields":[{"id":"stuck_points","type":"textarea","label":"What thoughts about the trauma feel most stuck or distressing?","placeholder":"e.g. It was my fault, I should have done something, I can never be safe"},{"id":"what_changed","type":"textarea","label":"How has the meaning of the event changed during therapy (if at all)?","placeholder":"Have any stuck points shifted?"}]}]}',
  true, false,
  ARRAY['trauma', 'PTSD', 'cognitive processing', 'stuck points', 'beliefs'],
  25, 1
);

-- Grounding Techniques Record
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  'e41ca277-e28a-4b03-b772-c1ae3f3eedd9',
  'Grounding Techniques Practice',
  'grounding-techniques-practice',
  'Practise and record the use of grounding techniques when experiencing flashbacks, dissociation, or overwhelming emotions.',
  'When you notice yourself becoming overwhelmed, dissociating, or experiencing a flashback, try one of the grounding techniques and record your experience here.',
  '{"version":1,"sections":[{"id":"episode","title":"What Happened","fields":[{"id":"date","type":"date","label":"Date","required":true},{"id":"trigger","type":"textarea","label":"What triggered the distress?","placeholder":"What happened just before? Was there a reminder of the trauma?"},{"id":"distress_before","type":"likert","label":"Distress level before grounding","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}}]},{"id":"technique","title":"Grounding Technique Used","fields":[{"id":"technique_used","type":"select","label":"Which technique did you use?","options":[{"id":"5_4_3_2_1","label":"5-4-3-2-1 (five senses)"},{"id":"breathing","label":"Slow breathing / box breathing"},{"id":"feet_on_floor","label":"Feet on the floor / body awareness"},{"id":"cold_water","label":"Cold water / ice / strong sensation"},{"id":"describe_surroundings","label":"Describe your surroundings out loud"},{"id":"mental_game","label":"Mental game (counting back, categories)"},{"id":"movement","label":"Movement (walking, stretching)"},{"id":"other","label":"Other"}]},{"id":"technique_detail","type":"textarea","label":"What exactly did you do?","placeholder":"Describe what you did step by step"},{"id":"how_long","type":"text","label":"How long did it take to feel grounded?","placeholder":"e.g. 5 minutes, 15 minutes"}]},{"id":"after","title":"After Grounding","fields":[{"id":"distress_after","type":"likert","label":"Distress level after grounding","min":0,"max":10,"step":1,"anchors":{"0":"None","5":"Moderate","10":"Extreme"}},{"id":"helpful","type":"likert","label":"How helpful was this technique?","min":0,"max":10,"step":1,"anchors":{"0":"Not at all","5":"Somewhat","10":"Very helpful"}},{"id":"notes","type":"textarea","label":"Notes for next time","placeholder":"What worked? What would you do differently?"}]}]}',
  true, false,
  ARRAY['trauma', 'PTSD', 'grounding', 'dissociation', 'flashbacks', 'coping'],
  10, 2
);

-- ============================================================================
-- LOW SELF-ESTEEM (2103d919-a17d-4ceb-a3ee-f2f1a59a7b99)
-- ============================================================================

-- Positive Data Log
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '2103d919-a17d-4ceb-a3ee-f2f1a59a7b99',
  'Positive Data Log',
  'positive-data-log',
  'Collect evidence that contradicts your negative core belief by recording positive experiences, qualities, and achievements.',
  'Identify your negative core belief, then actively notice and record any evidence — no matter how small — that contradicts it. This builds a new, more balanced view over time.',
  '{"version":1,"sections":[{"id":"belief","title":"The Belief to Challenge","fields":[{"id":"negative_belief","type":"textarea","label":"Negative core belief","required":true,"placeholder":"e.g. I''m worthless, I''m unlovable, I''m incompetent"},{"id":"new_belief","type":"textarea","label":"New, more balanced belief to build","required":true,"placeholder":"e.g. I have value, I am likeable, I am capable enough"},{"id":"belief_strength","type":"likert","label":"How much do you believe the new belief right now?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}}]},{"id":"evidence","title":"Evidence This Week","description":"Record any evidence that supports the new belief. Include small things.","fields":[{"id":"evidence_log","type":"table","label":"Positive data","columns":[{"id":"date","header":"Date","type":"text"},{"id":"evidence","header":"What happened","type":"text"},{"id":"what_it_shows","header":"What this shows about me","type":"text"}],"min_rows":5,"max_rows":10}]},{"id":"review","title":"Weekly Review","fields":[{"id":"belief_strength_now","type":"likert","label":"How much do you believe the new belief now?","min":0,"max":100,"step":5,"anchors":{"0":"Not at all","50":"Somewhat","100":"Completely"}},{"id":"reflection","type":"textarea","label":"What did you notice this week?","placeholder":"Was it hard to spot positive data? Did anything surprise you?"}]}]}',
  true, false,
  ARRAY['self-esteem', 'core beliefs', 'positive data log', 'Fennell', 'evidence'],
  15, 1
);

-- Self-Esteem Formulation
INSERT INTO worksheets (category_id, title, slug, description, instructions, schema, is_published, is_premium, tags, estimated_minutes, display_order)
VALUES (
  '2103d919-a17d-4ceb-a3ee-f2f1a59a7b99',
  'Low Self-Esteem Formulation',
  'low-self-esteem-formulation',
  'Map out how early experiences led to negative core beliefs and the rules, triggers, and maintenance cycles that keep low self-esteem going.',
  'Work through each section to understand how your low self-esteem developed and what keeps it going. This is based on Fennell''s cognitive model of low self-esteem.',
  '{"version":1,"sections":[{"id":"early","title":"Early Experiences","fields":[{"id":"experiences","type":"textarea","label":"What early experiences contributed to low self-esteem?","required":true,"placeholder":"e.g. Criticism, comparison to siblings, bullying, emotional neglect, high standards"}]},{"id":"bottom_line","title":"Bottom Line (Core Belief)","fields":[{"id":"core_belief","type":"textarea","label":"What is your bottom line about yourself?","required":true,"placeholder":"e.g. I''m not good enough, I''m inadequate, I''m unlovable"}]},{"id":"rules","title":"Rules for Living","description":"What rules have you developed to cope with this belief?","fields":[{"id":"rules","type":"textarea","label":"Rules and assumptions","placeholder":"e.g. If I work harder than everyone, I can hide that I''m not good enough. If I always put others first, they won''t reject me."}]},{"id":"trigger","title":"When Rules Are Broken","fields":[{"id":"trigger_situation","type":"textarea","label":"What situations trigger the core belief?","placeholder":"When do the rules fail or get broken? What activates the bottom line?"}]},{"id":"cycle","title":"Maintaining Cycle","description":"When triggered, what happens?","fields":[{"id":"predictions","type":"textarea","label":"Negative predictions","placeholder":"e.g. I''ll mess this up, they''ll see I''m a fraud"},{"id":"anxiety","type":"textarea","label":"Anxiety and emotions","placeholder":"What do you feel?"},{"id":"safety_behaviours","type":"textarea","label":"Safety behaviours / coping strategies","placeholder":"e.g. Over-preparing, avoiding challenges, seeking reassurance"},{"id":"self_criticism","type":"textarea","label":"Self-critical thoughts afterwards","placeholder":"e.g. I knew I couldn''t do it, everyone else manages fine"},{"id":"confirmation","type":"textarea","label":"How does this confirm the core belief?","placeholder":"How does the cycle end up reinforcing the bottom line?"}]}]}',
  true, false,
  ARRAY['self-esteem', 'formulation', 'Fennell', 'core beliefs', 'rules for living'],
  20, 2
);
