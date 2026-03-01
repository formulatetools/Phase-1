// FAQ content — separated from components for easy editing.

export interface FaqItem {
  q: string
  a: string
}

export interface FaqCategory {
  category: string
  questions: FaqItem[]
}

// ─── Key FAQ (prominent, fully visible) ──────────────────────────────────────

export const KEY_FAQ: FaqItem[] = [
  {
    q: 'What is Formulate?',
    a: 'Formulate is a digital worksheet platform built for therapists. You can browse a curated library of evidence-based CBT tools, assign interactive homework to clients via shareable links, and review their responses — all in one place. Worksheets are schema-driven, so they render beautifully on any device and can be exported as fillable PDFs or standalone HTML files.',
  },
  {
    q: 'Who is Formulate designed for?',
    a: 'Formulate is built for CBT therapists, clinical and counselling psychologists, psychological wellbeing practitioners, trainees, and supervisors. Whether you work in private practice, the NHS, or a training programme, the tools are designed to fit naturally into your clinical workflow.',
  },
  {
    q: 'Is my clients\' data safe?',
    a: 'Yes. Formulate is designed with privacy at its core. Client data is protected by row-level security in the database, meaning each therapist can only access their own clients\' data. Clients are identified by pseudonymous labels (initials or codes) — never by full name or email. The system validates input to prevent accidental PII entry, strips personal information before any AI processing, and supports full GDPR compliance including data access, deletion, and retention policies. All data is encrypted at rest.',
  },
  {
    q: 'Do clients need to create an account?',
    a: 'No. Clients access their homework through a unique, anonymous link — no login, no account, no password. The link contains a secure token that grants access to that specific worksheet. This reduces friction and means clients can complete homework on any device, including phones, without any setup.',
  },
  {
    q: 'What worksheets are available?',
    a: 'The library includes a growing collection of evidence-based tools spanning CBT thought records, graded exposure hierarchies, behavioural activation schedules, safety plans, worry decision trees, clinical formulations, and more. New worksheets are added regularly, and you can also create your own or fork and customise any existing tool.',
  },
  {
    q: 'Can I create my own worksheets?',
    a: 'Yes — on Practice and Specialist plans, you can build custom worksheets using a visual editor with 16 field types including text, scales, tables, checklists, computed fields, and interactive formulation diagrams. You can also fork any worksheet from the library and adapt it to your needs.',
  },
  {
    q: 'What is the AI worksheet generator?',
    a: 'You can describe the worksheet you need in plain English and our AI builds the full schema for you — sections, fields, instructions, and scoring. There\'s a free demo on the homepage (one generation per month). Paid plans include 3 to unlimited AI generations per month depending on your tier.',
  },
  {
    q: 'What are formulation diagrams?',
    a: 'Formulation diagrams are interactive visual models that can be embedded in any worksheet. Formulate includes 13 clinical templates covering Five Areas, Panic Cycle, Health Anxiety, Social Anxiety, GAD, PTSD, OCD, Depression, CBT-E, CFT, Insomnia, Chronic Pain, and BDD. Each template uses one of five layout patterns (cross-sectional, radial, vertical flow, cycle, or three systems) and is fully editable.',
  },
  {
    q: 'What export formats are available?',
    a: 'Three formats: (1) Fillable PDF — A4 portrait with NHS hole-punch compliant margins and interactive form fields. (2) Interactive HTML — a self-contained file that works offline with localStorage auto-save, ideal for emailing to clients. (3) Summary PDF — a read-only export of a completed worksheet for clinical records.',
  },
  {
    q: 'How much does Formulate cost?',
    a: 'There\'s a free tier with 5 worksheet uses per month and up to 3 clients. Starter is £4.99/month (unlimited use, 5 clients), Practice is £9.99/month (unlimited clients, custom worksheets, supervision), and Specialist is £19.99/month (up to 20 custom worksheets, 8 supervisees, unlimited AI). Annual billing saves roughly 20%. You can cancel at any time.',
  },
  {
    q: 'What\'s on the roadmap?',
    a: 'We\'re actively developing outcome measures and ecological momentary assessment (EMA) tracking, encrypted client email for automated homework reminders, a therapist-facing analytics dashboard, and a continuously expanding worksheet library. We also have a public feature request board where users can suggest and vote on what gets built next.',
  },
]

// ─── Extended FAQ (collapsed category sections) ─────────────────────────────

export const EXTENDED_FAQ: FaqCategory[] = [
  {
    category: 'Worksheets & Tools',
    questions: [
      {
        q: 'What field types can I use in custom worksheets?',
        a: 'The builder supports 16 field types: text, long text (textarea), number, date, time, dropdown select, Likert scales, checklists, tables, graded exposure hierarchies with gradient bars, multi-entry clinical records, computed fields (e.g. automatic belief change percentages), interactive formulation diagrams, decision trees, and safety plan layouts.',
      },
      {
        q: 'How does "fork & customise" work?',
        a: 'From any worksheet in the library, you can create a personal copy that becomes one of your custom worksheets. You can then edit the fields, instructions, sections, and scoring to suit your clinical approach — without affecting the original.',
      },
      {
        q: 'Can I import a worksheet from a description?',
        a: 'Yes. The AI import feature lets you paste a text description of a worksheet (or the content of an existing paper form) and generates a structured digital version. This is useful for digitising tools you already use in practice.',
      },
      {
        q: 'Are the worksheets evidence-based?',
        a: 'The library worksheets are based on established CBT models and clinical frameworks. They\'re designed by practitioners and reviewed before publication. Community-submitted worksheets go through an editorial review process before being added to the public library.',
      },
    ],
  },
  {
    category: 'Homework & Client Experience',
    questions: [
      {
        q: 'How do I assign homework to a client?',
        a: 'From any worksheet, click "Assign to client" and select the client from your list. You can set a due date, add a personal note, and optionally pre-fill certain fields. The system generates a unique link you can share via your usual communication channel.',
      },
      {
        q: 'Can I pre-fill parts of a worksheet before assigning?',
        a: 'Yes. When assigning homework, you can fill in specific fields in advance — for example, populating a situation or setting up an initial anxiety hierarchy. The client sees these pre-filled values and completes the rest.',
      },
      {
        q: 'What happens if a client doesn\'t complete their homework?',
        a: 'You can see assignment status on your dashboard (pending, in progress, completed, overdue). The system can send automated reminder emails to clients with overdue homework. You can also withdraw an assignment if it\'s no longer relevant.',
      },
      {
        q: 'Can I see when a client has started but not finished?',
        a: 'Yes. The dashboard shows whether an assignment is still pending or has been started (in progress). You\'ll see the status update as the client interacts with the worksheet.',
      },
      {
        q: 'Is the client experience mobile-friendly?',
        a: 'Yes. Worksheets are fully responsive and designed to work well on phones. Input fields use 16px minimum font size to prevent auto-zoom on iOS Safari, and the layout adapts to narrow screens.',
      },
    ],
  },
  {
    category: 'Privacy & Data Security',
    questions: [
      {
        q: 'What is a "pseudonymous client label"?',
        a: 'Instead of storing a client\'s full name, Formulate requires you to use a pseudonymous label — typically initials, a code, or a reference number (e.g. "JD", "Client-7"). The system actively validates your input and warns if it detects patterns that look like real names, email addresses, phone numbers, NHS numbers, or postcodes.',
      },
      {
        q: 'Can clients access or delete their own data?',
        a: 'Yes. Every client relationship generates a secure portal link. Through this portal, clients can view all their submitted responses and request deletion of individual responses or all their data — in line with GDPR Article 17 (right to erasure).',
      },
      {
        q: 'What is the client data portal?',
        a: 'The client data portal is a secure page accessible via a unique 16-character token. It gives clients direct access to their submitted worksheet responses without needing to contact the therapist. From there, they can review their data or request deletion.',
      },
      {
        q: 'How long do you keep data after deletion?',
        a: 'When data is deleted, it\'s soft-deleted immediately (hidden from all users) and permanently purged after 90 days. This retention period allows for accidental deletion recovery while ensuring data doesn\'t persist indefinitely. The purge runs automatically and is logged in an append-only audit trail.',
      },
      {
        q: 'Do you strip personal information before AI processing?',
        a: 'Yes. Before any text is sent to the AI for worksheet generation, it\'s run through a PII stripping process that detects and replaces email addresses, phone numbers, NHS numbers, National Insurance numbers, UK postcodes, dates of birth, and common names with bracketed placeholders like [EMAIL] or [NAME].',
      },
    ],
  },
  {
    category: 'Subscription & Billing',
    questions: [
      {
        q: 'Can I cancel at any time?',
        a: 'Yes. You can cancel your subscription from the Settings page at any time. You\'ll retain access to your paid features until the end of your current billing period. Your data is preserved — you can resubscribe later without losing anything.',
      },
      {
        q: 'What happens to my data if I downgrade?',
        a: 'Your data is never deleted when you downgrade. Custom worksheets and client records remain in your account. If you exceed the limits of your new tier (e.g. more clients than allowed), you\'ll be able to view existing data but may not be able to create new assignments until you\'re within the limits.',
      },
      {
        q: 'Do you offer student or trainee discounts?',
        a: 'We occasionally offer promotional codes. If you\'re a trainee or student, get in touch — we\'re happy to discuss options. You can also use the free tier, which includes 5 worksheet uses per month.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'Payments are processed securely through Stripe. We accept all major credit and debit cards. Prices are in GBP.',
      },
    ],
  },
  {
    category: 'Export & Sharing',
    questions: [
      {
        q: 'Can I use exported worksheets without an internet connection?',
        a: 'Yes. The interactive HTML export is a self-contained file that saves progress to your browser\'s local storage. You can email it to a client or use it on a device without internet access. The fillable PDF also works offline in any PDF reader.',
      },
      {
        q: 'Can I share worksheets with colleagues?',
        a: 'You can share any exported worksheet (PDF or HTML) directly. If you\'re on a plan with supervision features, your supervisees can view your assigned worksheets and client responses through the supervision portal.',
      },
      {
        q: 'Does the PDF include branding?',
        a: 'On the free tier, exported PDFs include a small Formulate watermark. On all paid tiers, PDFs are clean with no branding — ready for professional use.',
      },
    ],
  },
  {
    category: 'Supervision & Collaboration',
    questions: [
      {
        q: 'How does the supervision portal work?',
        a: 'On Practice and Specialist plans, you can add supervisees to your account. Supervisors can view their supervisees\' caseloads, assigned worksheets, and completed responses — useful for clinical oversight and training.',
      },
      {
        q: 'Can I submit my own worksheets to the library?',
        a: 'Yes. Contributors can submit worksheets for review through the content submission system. Approved worksheets are added to the public library and credited to the contributor.',
      },
      {
        q: 'Is there a community feature request board?',
        a: 'Yes. Logged-in users can submit feature requests and vote on existing ones. The most requested features help shape the development roadmap.',
      },
    ],
  },
]
