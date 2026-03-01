/**
 * Pre-filled example data for the "See the client experience" demo.
 *
 * Each key matches a worksheet slug. Values are keyed by field ID from
 * the worksheet schema. The data uses realistic but fictional clinical
 * scenarios — no real patient data.
 */

export const DEMO_WORKSHEETS = [
  {
    slug: '7-column-thought-record',
    title: '7-Column Thought Record',
    description: 'The classic CBT thought record — identify hot thoughts, weigh the evidence, and build a balanced perspective.',
    icon: 'thought-record',
  },
  {
    slug: 'graded-exposure-hierarchy',
    title: 'Graded Exposure Hierarchy',
    description: 'Build a fear ladder ranked by anxiety level and work your way up with graded exposure.',
    icon: 'hierarchy',
  },
  {
    slug: 'behavioural-activation-schedule',
    title: 'Behavioural Activation Schedule',
    description: 'Plan and rate activities with mastery and pleasure scores to rebuild a rewarding routine.',
    icon: 'schedule',
  },
] as const

export const DEMO_DATA: Record<string, Record<string, unknown>> = {
  '7-column-thought-record': {
    'record-table': [
      {
        situation:
          'Sitting at my desk at work. My manager walked past without saying hello. I had just sent a report that I wasn\'t fully confident about.',
        emotion: 'Anxious (80%), Embarrassed (65%), Sad (40%)',
        hot_thought:
          'She\'s ignoring me because my report was terrible. She probably thinks I\'m not good enough for this role.',
        belief_before: 85,
        evidence_for:
          'She did walk past without acknowledging me. I was unsure about one section of the report. She gave me constructive feedback last month.',
        evidence_against:
          'She often walks past quickly when heading to a meeting — it\'s not unusual. She praised my last project. No formal concerns raised. Other colleagues also didn\'t get a hello today.',
        balanced_thought:
          'My manager was probably rushing to a meeting. One section I\'m unsure about doesn\'t mean the whole report is bad. She\'s given me positive feedback recently.',
        belief_after: 30,
      },
    ],
  },

  'graded-exposure-hierarchy': {
    'target-fear':
      'Social anxiety — fear of being judged or embarrassed in social situations, especially with people I don\'t know well.',
    goal:
      'Be able to attend a networking event, introduce myself to three new people, and stay for at least an hour without using safety behaviours like checking my phone or standing in the corner.',
    'exposure-ladder': [
      { situation: 'Say good morning to a colleague I don\'t usually talk to', suds: 15, completed: 'Yes' },
      { situation: 'Ask a shop assistant for help finding something', suds: 25, completed: 'Yes' },
      { situation: 'Make small talk with a neighbour', suds: 35, completed: 'Yes' },
      { situation: 'Eat lunch in the shared kitchen at work instead of at my desk', suds: 45, completed: '' },
      { situation: 'Join a team meeting with camera on and contribute one comment', suds: 55, completed: '' },
      { situation: 'Start a conversation with someone at a café', suds: 60, completed: '' },
      { situation: 'Attend a group exercise class', suds: 70, completed: '' },
      { situation: 'Go to a friend\'s birthday party and stay for 2 hours', suds: 75, completed: '' },
      { situation: 'Attend a networking event and introduce myself to one new person', suds: 85, completed: '' },
      { situation: 'Give a 5-minute presentation to my team', suds: 90, completed: '' },
    ],
    'coping-strategies': ['mindfulness', 'acceptance', 'values', 'self-compassion'],
  },

  'behavioural-activation-schedule': {
    'activity-table': [
      { day: 'Monday', time: '7:30am', planned: 'Walk to the park (15 min)', actual: 'Walked around the block — shorter but still went', pleasure: 5, mastery: 7 },
      { day: 'Monday', time: '12:00pm', planned: 'Lunch with a colleague', actual: 'Had lunch in the kitchen, chatted briefly', pleasure: 4, mastery: 5 },
      { day: 'Tuesday', time: '9:00am', planned: 'Tidy the kitchen', actual: 'Cleaned kitchen and did laundry', pleasure: 3, mastery: 8 },
      { day: 'Tuesday', time: '6:00pm', planned: 'Cook dinner (new recipe)', actual: 'Made pasta — simple but cooked instead of ordering in', pleasure: 6, mastery: 7 },
      { day: 'Wednesday', time: '7:00am', planned: 'Morning jog (20 min)', actual: 'Didn\'t go — raining. Did stretching at home instead', pleasure: 3, mastery: 6 },
      { day: 'Wednesday', time: '7:00pm', planned: 'Phone a friend', actual: 'Texted instead — still made contact', pleasure: 5, mastery: 5 },
      { day: 'Thursday', time: '10:00am', planned: 'Work on CV for 30 min', actual: 'Worked on CV for 20 min', pleasure: 2, mastery: 8 },
    ],
    'highest-pleasure': 'Cooking dinner on Tuesday — it felt good to make something instead of ordering in. The walk on Monday morning was also surprisingly nice.',
    'highest-mastery': 'Tidying the kitchen and doing laundry on Tuesday. Working on my CV on Thursday — I really didn\'t want to but did it anyway.',
    'next-week': 'Schedule the morning walk for 3 days instead of 2. Try the actual jog if the weather is better. Call my friend instead of just texting.',
  },
}
