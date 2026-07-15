import type {
  AnalysisSection,
  AppNotification,
  AtsCheck,
  ChecklistItem,
  CoverTone,
  Job,
  KeywordGap,
  MatchDimension,
  ParsedResume,
  ResumeVersion,
  ScoreBar,
  SettingItem,
  SkillGap,
  SkillGapMini,
  StatCard,
  Suggestion,
  WritingIssue,
} from '../types';

export const BASE_SCORE = 82;

export const jobs: Job[] = [
  { id: 1, company: 'Stripe', title: 'Product Designer', mark: 'St', color: '#635bff', score: 92, location: 'Remote · US', posted: '2d ago', status: 'applied', deadline: 'Jul 20' },
  { id: 2, company: 'Linear', title: 'Design Engineer', mark: 'Li', color: '#5e6ad2', score: 88, location: 'Remote', posted: '3d ago', status: 'interview', deadline: 'Jul 18' },
  { id: 3, company: 'Notion', title: 'Senior UX Designer', mark: 'No', color: '#111827', score: 84, location: 'San Francisco', posted: '4d ago', status: 'applied', deadline: 'Jul 22' },
  { id: 4, company: 'Figma', title: 'Product Designer II', mark: 'Fi', color: '#a259ff', score: 78, location: 'New York', posted: '1w ago', status: 'saved', deadline: 'Jul 16' },
  { id: 5, company: 'Vercel', title: 'Sr. Product Designer', mark: 'Ve', color: '#0f172a', score: 74, location: 'Remote', posted: '5d ago', status: 'saved', deadline: 'Jul 28' },
  { id: 6, company: 'Datadog', title: 'Product Designer', mark: 'Da', color: '#7c3aed', score: 91, location: 'Remote · US', posted: '1d ago', status: 'offer', deadline: '—' },
  { id: 7, company: 'Airbnb', title: 'UX Designer', mark: 'Ai', color: '#ff385c', score: 69, location: 'Seattle', posted: '2w ago', status: 'rejected', deadline: '—' },
];

export const scoreBars: ScoreBar[] = [
  { label: 'ATS compatibility', value: 88, tone: 'accent' },
  { label: 'Content quality', value: 79, tone: 'accent' },
  { label: 'Formatting', value: 91, tone: 'accent' },
  { label: 'Keyword coverage', value: 70, tone: 'amber' },
];

export const checklist: ChecklistItem[] = [
  { text: 'Add a professional summary', done: true },
  { text: 'Quantify 3 key achievements', done: true },
  { text: 'Add keywords for target roles', done: false },
  { text: 'Fix 4 grammar & wording issues', done: false },
  { text: 'Add a Certifications section', done: false },
];

export const stats: StatCard[] = [
  { icon: 'send', label: 'Applications', value: '12', delta: '+3 this week' },
  { icon: 'groups', label: 'Interviews', value: '3', delta: '+1 this week' },
  { icon: 'track_changes', label: 'Avg. match', value: '79%', delta: '+6% vs last wk' },
  { icon: 'mark_email_read', label: 'Response rate', value: '42%', delta: 'vs 28% avg' },
];

export const skillGapMini: SkillGapMini[] = [
  { skill: 'SQL', freq: 8, pct: 67 },
  { skill: 'Accessibility (WCAG)', freq: 6, pct: 50 },
  { skill: 'Motion design', freq: 5, pct: 42 },
];

export const parsedResume: ParsedResume = {
  name: 'Jordan Diaz',
  email: 'jordan.diaz@email.com',
  phone: '(415) 555-0132',
  location: 'San Francisco, CA',
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      year: '2020 – 2024',
      extra: "GPA 3.8 · Dean's List · HCI concentration",
    },
  ],
  skills: ['Figma', 'Prototyping', 'User research', 'Design systems', 'Wireframing', 'HTML/CSS', 'JavaScript', 'Usability testing'],
  experience: [
    {
      role: 'Product Design Intern',
      company: 'Acme Corp',
      dates: 'Jun 2023 – Aug 2023',
      bullets: ['Managed the company social media accounts.', 'Helped with the redesign of the company website.'],
    },
    {
      role: 'UX Design Assistant',
      company: 'Campus Labs',
      dates: 'Sep 2022 – May 2023',
      bullets: ['Supported user research across 3 student products.', 'Created wireframes and prototypes in Figma.'],
    },
  ],
};

export const analysisSections: AnalysisSection[] = [
  { name: 'Contact info', score: 96, note: 'Complete and well-formatted.', level: 'good' },
  { name: 'Professional summary', score: 72, note: 'Present, but generic — add measurable impact.', level: 'warn' },
  { name: 'Work experience', score: 84, note: 'Strong overall. 2 bullets lack action verbs.', level: 'good' },
  { name: 'Skills', score: 64, note: 'Missing 5 keywords for your target roles.', level: 'warn' },
  { name: 'Education', score: 92, note: 'Clear and complete.', level: 'good' },
  { name: 'Certifications', score: 0, note: 'No section found — recruiters expect one.', level: 'bad' },
];

export const atsChecks: AtsCheck[] = [
  { label: 'Standard section headings', pass: true },
  { label: 'Machine-readable fonts', pass: true },
  { label: 'No tables, columns or text boxes', pass: true },
  { label: 'Consistent date formatting', pass: false },
  { label: 'Contact info in body, not header', pass: true },
  { label: 'Simple, parsable file name', pass: true },
];
export const ATS_SCORE = 88;

export const writingIssues: WritingIssue[] = [
  { type: 'Grammar', severity: 'warn', text: '"Responsible for managing team" uses passive phrasing.', fix: 'Led a team of 5 designers…' },
  { type: 'Weak verb', severity: 'warn', text: '"Helped with" is low-impact.', fix: 'Drove · Delivered · Owned' },
  { type: 'Spelling', severity: 'bad', text: '"recieved" is misspelled.', fix: 'received' },
  { type: 'Consistency', severity: 'warn', text: 'Mixed date formats (2021 vs Jan 2021).', fix: 'Use "Jan 2021" throughout' },
];

export const suggestions: Suggestion[] = [
  { id: 1, section: 'Experience · Acme Corp', before: 'Responsible for managing the company social media accounts.', after: 'Led social strategy across 4 channels, growing engagement 63% in 6 months.', tags: ['Action verb', 'Quantified'] },
  { id: 2, section: 'Experience · Acme Corp', before: 'Helped with the redesign of the company website.', after: 'Redesigned the marketing site, lifting conversion 24% and cutting bounce rate 18%.', tags: ['Action verb', 'Quantified'] },
  { id: 3, section: 'Professional summary', before: 'Hard-working designer looking for new opportunities.', after: 'Product designer with 4 years shipping B2B SaaS used by 40k+ people.', tags: ['Impact', 'Specific'] },
  { id: 4, section: 'Projects · Habitr', before: 'Made an app for tracking habits.', after: 'Built Habitr, a React Native habit tracker with 1.2k downloads and a 4.7★ rating.', tags: ['Quantified', 'Tech stack'] },
  { id: 5, section: 'Skills', before: 'Good communication and teamwork skills.', after: 'Facilitated 20+ cross-functional workshops aligning design, PM and engineering.', tags: ['Specific', 'Impact'] },
];

export const matchDimensions: MatchDimension[] = [
  { label: 'Skills match', pct: 88 },
  { label: 'Experience fit', pct: 76 },
  { label: 'Education fit', pct: 100 },
  { label: 'Keyword coverage', pct: 70 },
];

export const matchedSkills: string[] = ['Figma', 'Prototyping', 'Design systems', 'User research', 'Wireframing', 'Usability testing', 'Interaction design'];
export const missingSkills: string[] = ['Framer', 'Motion design', 'HTML/CSS', 'Accessibility (WCAG)', 'Data-informed design'];

export const keywordGaps: KeywordGap[] = [
  { keyword: 'design systems', present: true },
  { keyword: 'user research', present: true },
  { keyword: 'prototyping', present: true },
  { keyword: 'figma', present: true },
  { keyword: 'roadmap', present: true },
  { keyword: 'a/b testing', present: false },
  { keyword: 'accessibility', present: false },
  { keyword: 'design tokens', present: false },
];

export const versions: ResumeVersion[] = [
  { tag: 'v4', name: 'Tailored for Stripe', date: 'Jul 12', score: 86, current: true, note: 'Optimized for the Product Designer role' },
  { tag: 'v3', name: 'Added certifications', date: 'Jul 8', score: 81, current: false, note: 'Added AWS + Google UX certs' },
  { tag: 'v2', name: 'Quantified achievements', date: 'Jul 3', score: 74, current: false, note: 'Rewrote 8 bullets with metrics' },
  { tag: 'v1', name: 'Original upload', date: 'Jun 28', score: 68, current: false, note: 'First imported version' },
];
export const versionScores: number[] = [68, 74, 81, 86];

export const skillGaps: SkillGap[] = [
  { skill: 'SQL', freq: 8, of: 12, courses: [{ name: 'SQL for Data Analysis', provider: 'Coursera', length: '12 hrs' }, { name: 'Intro to Databases', provider: 'Udacity', length: '3 wks' }] },
  { skill: 'Accessibility (WCAG)', freq: 6, of: 12, courses: [{ name: 'Web Accessibility', provider: 'Google', length: '8 hrs' }, { name: 'WCAG Deep Dive', provider: 'Deque U', length: '6 hrs' }] },
  { skill: 'Motion design', freq: 5, of: 12, courses: [{ name: 'Motion with Framer', provider: 'Framer', length: '4 hrs' }, { name: 'Principles of Motion', provider: 'MDS', length: '10 hrs' }] },
  { skill: 'A/B testing', freq: 4, of: 12, courses: [{ name: 'Experimentation 101', provider: 'Reforge', length: '5 hrs' }] },
  { skill: 'Design tokens', freq: 3, of: 12, courses: [{ name: 'Design Systems in Figma', provider: 'Figma', length: '3 hrs' }] },
];

export const notifications: AppNotification[] = [
  { id: 1, icon: 'schedule', tone: 'amber', title: 'Application deadline tomorrow', body: 'Figma — Product Designer II closes Jul 16. You saved it 4 days ago.', time: '2h ago', unread: true, cta: 'View job' },
  { id: 2, icon: 'auto_awesome', tone: 'accent', title: '6 new AI suggestions ready', body: 'We found rewrites that could lift your résumé score by ~9 points.', time: '5h ago', unread: true, cta: 'Review' },
  { id: 3, icon: 'track_changes', tone: 'green', title: 'New 91% match found', body: 'Datadog — Product Designer strongly matches your profile.', time: '1d ago', unread: true, cta: 'See match' },
  { id: 4, icon: 'insights', tone: 'accent', title: 'Your weekly progress summary', body: '3 applications, 1 interview, score up 6 points. Solid week!', time: '2d ago', unread: false, cta: 'View report' },
  { id: 5, icon: 'verified', tone: 'green', title: 'Résumé passed ATS check', body: 'Your latest version is readable by all major applicant tracking systems.', time: '3d ago', unread: false, cta: '' },
];

export const settingItems: SettingItem[] = [
  { key: 'deadline', label: 'Application deadline reminders', desc: 'Notify me 24 hours before a saved job closes.' },
  { key: 'aiSug', label: 'New AI suggestions', desc: 'When we find ways to improve my résumé.' },
  { key: 'matches', label: 'New job matches', desc: 'When a new role matches 85%+ of my profile.' },
  { key: 'weekly', label: 'Weekly progress summary', desc: 'A Monday digest of my job-search activity.' },
  { key: 'product', label: 'Product updates', desc: 'Occasional news about new features.' },
  { key: 'marketing', label: 'Tips & career advice', desc: 'Curated content to help my search.' },
];

export const defaultSettings: Record<string, boolean> = {
  deadline: true,
  weekly: true,
  aiSug: true,
  matches: false,
  product: false,
  marketing: false,
};

export const coverTones: CoverTone[] = [
  { key: 'formal', label: 'Formal', desc: 'Polished & professional' },
  { key: 'friendly', label: 'Friendly', desc: 'Warm & personable' },
  { key: 'concise', label: 'Concise', desc: 'Short & direct' },
  { key: 'confident', label: 'Confident', desc: 'Bold & assertive' },
];

export const onboardingFields: string[] = ['Computer Science', 'Design', 'Business', 'Engineering', 'Marketing', 'Data Science', 'Psychology', 'Other'];
export const onboardingRoles: string[] = ['Product Designer', 'UX Designer', 'UX Researcher', 'Design Engineer', 'UI Designer', 'Product Manager', 'Frontend Engineer', 'Design Lead', 'Content Designer'];
export const onboardingIndustries: string[] = ['Technology', 'Fintech', 'Healthcare', 'E-commerce', 'Media', 'Education', 'Gaming', 'Enterprise SaaS'];
export const onboardingExpLevels: string[] = ['Student / New grad', 'Junior', 'Mid-level', 'Senior', 'Lead / Manager'];
