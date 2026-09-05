/**
 * Central In-App Guidance & Knowledge Engine for TutorPulse
 *
 * Provides structured, plain-English explanations, step-by-step workflows,
 * key concept definitions, common mistake warnings, form field explanations,
 * and searchable FAQs across all application features.
 */

export interface FieldGuide {
  label: string
  description: string
  example?: string
  required?: boolean
  tip?: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface HelpTopic {
  id: string
  title: string
  category: string
  shortSummary: string
  whyItExists: string
  whatToDoFirst: string[]
  keyConcepts: { term: string; explanation: string }[]
  recommendedWorkflow: string[]
  commonMistakes: { mistake: string; solution: string }[]
  fieldGuides?: Record<string, FieldGuide>
  faq: FAQItem[]
  relatedLinks?: { label: string; href: string }[]
}

export const HELP_TOPICS: Record<string, HelpTopic> = {
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard & Command Center',
    category: 'Getting Started',
    shortSummary: 'Your daily tutoring hub showing today’s classes, student roster numbers, attendance rates, and pending fee collection.',
    whyItExists: 'As a tutor, you juggle multiple batches, students, payments, and schedules. The Dashboard gives you an immediate bird’s-eye view of what needs your attention right now without clicking through multiple menus.',
    whatToDoFirst: [
      'Create your first batch to establish your subject and timetable.',
      'Add your students and enroll them into the batch.',
      'Set the batch schedule (working days and class hours).',
      'Mark attendance for today’s scheduled classes.',
      'Add fee dues so you know who has paid and who has outstanding fees.',
    ],
    keyConcepts: [
      {
        term: "Today's Classes",
        explanation: 'Classes automatically scheduled for today based on your batch working days. You can take attendance directly from each card.',
      },
      {
        term: 'Active Roster',
        explanation: 'The total number of students currently actively enrolled and attending your classes.',
      },
      {
        term: 'Monthly Collection Rate',
        explanation: 'The percentage of tuition fees paid this month compared to total fees due.',
      },
      {
        term: 'System Alerts',
        explanation: 'Automatic reminders for pending attendance, upcoming fee due dates, or unsubmitted homework.',
      },
    ],
    recommendedWorkflow: [
      'Open your dashboard each morning to check which batches meet today.',
      'Click "Attendance" on today’s class cards as students arrive or when class starts.',
      'Review pending fee alerts and send reminders if needed.',
      'Post any homework or announcements before concluding your teaching day.',
    ],
    commonMistakes: [
      {
        mistake: 'Waiting until the end of the month to record attendance and fees.',
        solution: 'Mark attendance immediately during class and record fee payments as soon as received so your statistics remain accurate.',
      },
      {
        mistake: 'Expecting students to appear before assigning them to a batch.',
        solution: 'Creating a student record is step 1; make sure to assign them to at least one batch so they appear in class attendance rosters.',
      },
    ],
    faq: [
      {
        question: 'Why are there no classes showing for today?',
        answer: 'Today’s classes appear if you have an active batch whose working days include today (e.g. Monday). If no classes show, check your batch working days under the Batches page.',
      },
      {
        question: 'Can parents see my dashboard?',
        answer: 'No. The Tutor Dashboard is private to you. Parents have their own secure Parent Portal where they only see their child’s individual records.',
      },
    ],
    relatedLinks: [
      { label: 'Batches', href: '/dashboard/batches' },
      { label: 'Calendar', href: '/dashboard/calendar' },
      { label: 'Students', href: '/dashboard/students' },
      { label: 'Reports', href: '/dashboard/reports' },
    ],
  },

  students: {
    id: 'students',
    title: 'Students Management',
    category: 'Core Management',
    shortSummary: 'Manage student profiles, academic grade levels, contact numbers, and batch enrollments.',
    whyItExists: 'Every attendance check, test mark, homework assignment, and fee receipt is tied to a student. Having complete student profiles ensures you have contact details when you need them and maintains accurate academic history.',
    whatToDoFirst: [
      'Click "Add Student" or use the quick action button.',
      'Enter the student’s full name and their class or grade level.',
      'Add a contact number (either student or parent phone).',
      'Once saved, assign the student to one or more batches.',
    ],
    keyConcepts: [
      {
        term: 'Student Record',
        explanation: 'The master profile storing contact details, academic grade, school, and date of birth.',
      },
      {
        term: 'Active vs Inactive Status',
        explanation: 'Active students appear in attendance sheets and reports. Inactive students are kept for historical records but excluded from daily rosters.',
      },
      {
        term: 'Batch Enrollment',
        explanation: 'Linking a student to a specific batch so they show up on that batch’s calendar sessions and attendance register.',
      },
    ],
    recommendedWorkflow: [
      'Enroll new student with their name, grade, and parent phone number.',
      'Open the Batches page or the student details page to assign them to their subject batch.',
      'If you communicate with parents, link a parent record so parents can access the Parent Portal.',
    ],
    commonMistakes: [
      {
        mistake: 'Entering nicknames instead of full names.',
        solution: 'Use full names so test reports and fee receipts look professional when viewed by parents.',
      },
      {
        mistake: 'Deleting a student when they pause classes for a few weeks.',
        solution: 'Set their status to "Inactive" instead of deleting. This preserves their historical attendance and payment history.',
      },
    ],
    fieldGuides: {
      full_name: {
        label: 'Full Name',
        description: 'Enter the student’s complete first and last name.',
        example: 'Aarav Patel',
        required: true,
        tip: 'Used on all reports, attendance registers, and test results.',
      },
      phone: {
        label: 'Phone Number',
        description: 'Direct mobile number for the student (optional if parent phone is provided).',
        example: '+91 98765 43210',
        required: false,
      },
      email: {
        label: 'Email Address',
        description: 'Student’s email address for notifications and direct communication.',
        example: 'student@example.com',
        required: false,
      },
      class_name: {
        label: 'Class / Grade',
        description: 'Current school grade or standard.',
        example: 'Class 10, Grade 8, or 12th Standard',
        required: false,
      },
      school_name: {
        label: 'School Name',
        description: 'Name of the educational institution the student attends.',
        example: 'Delhi Public School',
        required: false,
      },
      status: {
        label: 'Enrollment Status',
        description: 'Set to Active for current students. Set to Inactive if a student is on temporary leave or has completed tuition.',
        example: 'Active',
        required: true,
      },
      notes: {
        label: 'Tutor Notes',
        description: 'Private notes for yourself regarding learning pace, strengths, or areas needing attention. Never visible to parents.',
        example: 'Needs extra practice with trigonometry proofs.',
        required: false,
      },
    },
    faq: [
      {
        question: 'Can a student be in more than one batch?',
        answer: 'Yes! A student can be enrolled in multiple batches, such as "Class 10 Maths" and "Class 10 Science". Their attendance and fees are tracked appropriately.',
      },
      {
        question: 'How do I add multiple students quickly?',
        answer: 'You can add students one-by-one with the "Add Student" button, or use the CSV student import feature on the students page.',
      },
    ],
    relatedLinks: [
      { label: 'Batches', href: '/dashboard/batches' },
      { label: 'Parents', href: '/dashboard/parents' },
      { label: 'Attendance', href: '/dashboard/attendance' },
    ],
  },

  batches: {
    id: 'batches',
    title: 'Batches & Scheduling Engine',
    category: 'Core Management',
    shortSummary: 'Organize students by subject and schedule. Each batch defines its own working days, start time, end time, and class mode.',
    whyItExists: 'Tutors teach different subjects to different groups at different times. Batches are the core building block of TutorPulse: they automatically generate your calendar sessions and attendance rosters.',
    whatToDoFirst: [
      'Name your batch (e.g., "Class 10 Physics").',
      'Enter the subject name.',
      'Select the working days when this batch meets (e.g. Mon, Wed, Fri).',
      'Set the start time and end time.',
      'Choose the class mode (Offline, Online, or Hybrid).',
      'Add student members to the batch.',
    ],
    keyConcepts: [
      {
        term: 'Batch Schedule vs Class Session',
        explanation: 'Your batch schedule defines when classes normally happen every week. A class session is a specific occurrence on a calendar date (e.g. Wednesday, Sep 9).',
      },
      {
        term: 'Working Days',
        explanation: 'The recurring days of the week when this batch meets. TutorPulse automatically generates class sessions for these days.',
      },
      {
        term: 'Offline Mode',
        explanation: 'Students attend in person at your tuition center, home studio, or classroom.',
      },
      {
        term: 'Online Mode',
        explanation: 'Classes occur virtually via video link (Google Meet, Zoom, etc.). You can save the meeting link in the batch or session.',
      },
      {
        term: 'Hybrid Mode',
        explanation: 'Classes offer both in-person seating and remote live attendance simultaneously.',
      },
    ],
    recommendedWorkflow: [
      'Create one batch per subject and grade level.',
      'Configure regular working days and hours.',
      'Add enrolled students.',
      'Check the Calendar to verify that all class sessions for the month appear automatically.',
    ],
    commonMistakes: [
      {
        mistake: 'Putting students of different grades into a single batch without a clear schedule.',
        solution: 'Separate different grades into distinct batches (e.g. "Grade 9 Maths" and "Grade 10 Maths") so attendance and test scores remain organized.',
      },
      {
        mistake: 'Leaving working days unselected.',
        solution: 'Always select at least one working day so TutorPulse can automatically build your calendar sessions.',
      },
    ],
    fieldGuides: {
      name: {
        label: 'Batch Name',
        description: 'A recognizable title for this tutoring group.',
        example: 'Class 10 ICSE Mathematics',
        required: true,
      },
      subject: {
        label: 'Subject',
        description: 'The academic discipline taught in this batch.',
        example: 'Mathematics, Science, English, Accounts',
        required: true,
      },
      class_mode: {
        label: 'Class Mode',
        description: 'Choose whether classes are held in person (Offline), over video call (Online), or both (Hybrid).',
        example: 'Offline',
        required: true,
      },
      location: {
        label: 'Location / Address',
        description: 'Physical room or classroom address for offline sessions, or meeting platform instructions.',
        example: 'Room 2, Main Center, MG Road',
        required: false,
      },
      working_days: {
        label: 'Working Days',
        description: 'Select each day of the week this batch normally meets.',
        example: 'Monday, Wednesday, Friday',
        required: true,
        tip: 'TutorPulse uses these days to automatically place class sessions onto your calendar.',
      },
      start_time: {
        label: 'Start Time',
        description: 'The time class begins.',
        example: '05:00 PM',
        required: true,
      },
      end_time: {
        label: 'End Time',
        description: 'The time class concludes. Must be later than start time.',
        example: '06:30 PM',
        required: true,
      },
    },
    faq: [
      {
        question: 'What happens if a holiday falls on a class day?',
        answer: 'You don’t need to change your batch schedule! Open the Calendar, click on that specific date’s class session, and choose "Cancel Session" or "Reschedule". Your recurring schedule remains intact.',
      },
      {
        question: 'How do I add a new student to an existing batch?',
        answer: 'Open the batch details page, click "Add Students", check the boxes next to the students you wish to enroll, and click Save.',
      },
    ],
    relatedLinks: [
      { label: 'Calendar', href: '/dashboard/calendar' },
      { label: 'Attendance', href: '/dashboard/attendance' },
      { label: 'Students', href: '/dashboard/students' },
    ],
  },

  calendar: {
    id: 'calendar',
    title: 'Calendar & Class Sessions',
    category: 'Core Management',
    shortSummary: 'View, reschedule, and manage specific class occurrences generated from your batch schedules.',
    whyItExists: 'Recurring batch schedules are ideal for planning, but real life requires flexibility. The Calendar lets you view every class session, reschedule when needed, cancel for holidays, or add extra revision classes.',
    whatToDoFirst: [
      'Switch between Month, Week, and Day views to see your upcoming schedule.',
      'Filter by a specific batch or view all batches together.',
      'Click any class session to view details, mark attendance, or adjust timings.',
    ],
    keyConcepts: [
      {
        term: 'Scheduled Session',
        explanation: 'A normal upcoming class waiting to take place.',
      },
      {
        term: 'In Progress Session',
        explanation: 'A class currently underway.',
      },
      {
        term: 'Completed Session',
        explanation: 'A class that has concluded and has attendance recorded.',
      },
      {
        term: 'Cancelled Session',
        explanation: 'A session marked as cancelled (e.g. for a national holiday or tutor emergency). It remains visible on the calendar marked as cancelled.',
      },
      {
        term: 'Session Rescheduling',
        explanation: 'Moving a specific date’s class to another day or time without altering your recurring weekly timetable.',
      },
      {
        term: 'Additional Session',
        explanation: 'An extra class (such as an exam review or doubt-clearing session) scheduled outside normal recurring days.',
      },
    ],
    recommendedWorkflow: [
      'Check the Week view every Sunday evening to plan your upcoming teaching week.',
      'If you need to move a class, click the session and choose "Reschedule Session".',
      'On class day, click the session card to jump directly into marking attendance.',
    ],
    commonMistakes: [
      {
        mistake: 'Editing the batch schedule when you just want to move one class.',
        solution: 'Use the "Reschedule" button on the specific session in the Calendar. Editing the batch schedule changes all future weeks!',
      },
    ],
    faq: [
      {
        question: 'Do parents see rescheduled sessions in their portal?',
        answer: 'Yes. The Parent Portal reflects real-time session dates, times, and cancellations so parents always know when classes take place.',
      },
    ],
    relatedLinks: [
      { label: 'Batches', href: '/dashboard/batches' },
      { label: 'Attendance', href: '/dashboard/attendance' },
    ],
  },

  attendance: {
    id: 'attendance',
    title: 'Attendance Tracker',
    category: 'Daily Operations',
    shortSummary: 'Take roll call for each class session, track present, absent, or late students, and maintain historical attendance.',
    whyItExists: 'Consistent attendance is the #1 predictor of student academic performance. Tracking attendance holds students accountable, reassures parents, and generates attendance percentages for progress reports.',
    whatToDoFirst: [
      'Select the batch and date for attendance.',
      'Mark each student as Present, Absent, or Late.',
      'Click "Save Attendance".',
    ],
    keyConcepts: [
      {
        term: 'Present (Green)',
        explanation: 'Student attended the class on time.',
      },
      {
        term: 'Absent (Red)',
        explanation: 'Student did not attend the class.',
      },
      {
        term: 'Late (Amber)',
        explanation: 'Student attended but arrived after class had started.',
      },
      {
        term: 'Session-Linked Attendance',
        explanation: 'Attendance tied directly to a specific calendar class session.',
      },
    ],
    recommendedWorkflow: [
      'Take attendance within the first 10 minutes of class.',
      'Mark absent students promptly.',
      'Hit "Save Attendance" — attendance metrics, dashboard statistics, and parent portal feeds update immediately.',
    ],
    commonMistakes: [
      {
        mistake: 'Forgetting to hit "Save Attendance" after marking checkboxes.',
        solution: 'Always click the blue "Save Attendance" button at the bottom of the roster to store your changes.',
      },
    ],
    faq: [
      {
        question: 'Can I edit attendance later if a student arrived late?',
        answer: 'Yes! Re-open the attendance page for that batch and date, update their status, and click "Save Attendance" again.',
      },
      {
        question: 'Can parents see attendance immediately?',
        answer: 'Yes, parents logged into the Parent Portal see their child’s attendance updated in real time.',
      },
    ],
    relatedLinks: [
      { label: 'Calendar', href: '/dashboard/calendar' },
      { label: 'Reports', href: '/dashboard/reports' },
    ],
  },

  tests: {
    id: 'tests',
    title: 'Tests & Examination Results',
    category: 'Academic Tracking',
    shortSummary: 'Create tests, record scores, calculate percentages, and track academic growth across batches.',
    whyItExists: 'Assessments show whether students are mastering the subject. Recording test scores in TutorPulse helps you spot struggling students early and demonstrates measurable progress to parents.',
    whatToDoFirst: [
      'Click "Create Test".',
      'Choose the batch and subject.',
      'Enter the maximum possible marks (e.g. 100 or 50) and passing marks.',
      'Enter the date the test was held.',
      'Record each student’s score in the results table and save.',
    ],
    keyConcepts: [
      {
        term: 'Total / Max Marks',
        explanation: 'The maximum score achievable on the test (e.g. 50, 100).',
      },
      {
        term: 'Passing Marks',
        explanation: 'The minimum score required to pass.',
      },
      {
        term: 'Score Percentage',
        explanation: 'Automatically calculated by TutorPulse as (Score / Max Marks) * 100.',
      },
    ],
    recommendedWorkflow: [
      'Create the test entry ahead of time or on exam day.',
      'Grade answer sheets and enter marks in one sitting.',
      'Review the batch average to see if the topic needs revision.',
    ],
    commonMistakes: [
      {
        mistake: 'Entering marks higher than the Maximum Marks.',
        solution: 'Ensure student marks do not exceed the test maximum.',
      },
    ],
    fieldGuides: {
      title: {
        label: 'Test Title',
        description: 'Descriptive name for the examination.',
        example: 'Chapter 3: Quadratic Equations Unit Test',
        required: true,
      },
      batch_id: {
        label: 'Batch',
        description: 'The batch whose students took this test.',
        example: 'Class 10 Mathematics',
        required: true,
      },
      total_marks: {
        label: 'Maximum Marks',
        description: 'Highest possible score.',
        example: '50',
        required: true,
      },
      passing_marks: {
        label: 'Passing Marks',
        description: 'Minimum marks needed to pass.',
        example: '20',
        required: false,
      },
      test_date: {
        label: 'Test Date',
        description: 'Date the assessment was conducted.',
        example: '2026-09-10',
        required: true,
      },
    },
    faq: [
      {
        question: 'Can parents see test results?',
        answer: 'Yes! When a parent logs into the Parent Portal, they can view their child’s score, percentage, and the test date.',
      },
    ],
    relatedLinks: [
      { label: 'Reports', href: '/dashboard/reports' },
      { label: 'Batches', href: '/dashboard/batches' },
    ],
  },

  fees: {
    id: 'fees',
    title: 'Fee Management & Payment Records',
    category: 'Tuition Finances',
    shortSummary: 'Log tuition fees, due dates, paid amounts, and unpaid balances for each student.',
    whyItExists: 'Managing tuition fees in notebooks or spreadsheets leads to missed payments and awkward conversations. TutorPulse keeps clear, indisputable records of every due date, payment date, and outstanding balance.',
    whatToDoFirst: [
      'Click "Add Fee Record".',
      'Select the student and batch.',
      'Enter the fee amount and due date.',
      'Mark as "Paid" if already collected, or leave as "Pending" until received.',
    ],
    keyConcepts: [
      {
        term: 'Important Financial Note',
        explanation: 'TutorPulse is a financial record-keeper. It tracks your dues and receipts but does NOT directly debit bank accounts or transfer money.',
      },
      {
        term: 'Paid vs Pending vs Overdue',
        explanation: 'Paid records mean funds were received. Pending means payment is expected before the due date. Overdue means the due date has passed without payment.',
      },
      {
        term: 'Partial Payments',
        explanation: 'When a parent pays part of the fee, you can record the collected portion and track the remaining balance.',
      },
    ],
    recommendedWorkflow: [
      'Create monthly fee dues at the start of each tuition month.',
      'When cash, UPI, or bank transfer is received, open the record and mark it as Paid.',
      'Review the Fees page weekly to identify pending balances.',
    ],
    commonMistakes: [
      {
        mistake: 'Assuming TutorPulse will automatically collect money from parents’ credit cards.',
        solution: 'TutorPulse tracks payment records. Parents pay you via your usual method (UPI, cash, bank transfer), and you log the payment here.',
      },
    ],
    fieldGuides: {
      student_id: {
        label: 'Student',
        description: 'The student responsible for this fee record.',
        required: true,
      },
      amount: {
        label: 'Fee Amount',
        description: 'Total fee due in your currency (₹).',
        example: '2500',
        required: true,
      },
      due_date: {
        label: 'Due Date',
        description: 'Deadline for payment.',
        example: '2026-09-15',
        required: true,
      },
      status: {
        label: 'Payment Status',
        description: 'Paid, Pending, or Overdue.',
        required: true,
      },
    },
    faq: [
      {
        question: 'Do parents get receipts?',
        answer: 'Parents can view their payment history and current fee balance anytime inside their Parent Portal.',
      },
    ],
    relatedLinks: [
      { label: 'Reports', href: '/dashboard/reports' },
      { label: 'Students', href: '/dashboard/students' },
    ],
  },

  homework: {
    id: 'homework',
    title: 'Homework & Assignments',
    category: 'Academic Tracking',
    shortSummary: 'Assign homework tasks, set submission deadlines, and monitor student completion.',
    whyItExists: 'Assigning homework verbally often leads to students claiming they forgot. Posting homework in TutorPulse gives students and parents a clear record with instructions and due dates.',
    whatToDoFirst: [
      'Click "Create Homework".',
      'Select the batch and subject.',
      'Write the title and clear instructions.',
      'Set the submission deadline date.',
      'Save to publish to the student and parent view.',
    ],
    keyConcepts: [
      {
        term: 'Batch Assignment',
        explanation: 'Homework is assigned to an entire batch so all students in that class receive the task.',
      },
      {
        term: 'Due Date',
        explanation: 'The deadline by which students must complete the homework.',
      },
    ],
    recommendedWorkflow: [
      'Post homework immediately at the end of class.',
      'Set the due date to the next class session date.',
      'Check completion status at the start of the next session.',
    ],
    commonMistakes: [
      {
        mistake: 'Posting vague instructions like "Do homework".',
        solution: 'Include exact textbook page numbers, exercise numbers, and questions (e.g. "Exercise 4.2, Questions 1 to 8 on page 64").',
      },
    ],
    fieldGuides: {
      title: {
        label: 'Homework Title',
        description: 'Brief headline for the assignment.',
        example: 'Linear Equations Practice Sheet',
        required: true,
      },
      batch_id: {
        label: 'Batch',
        description: 'The batch this assignment is for.',
        required: true,
      },
      due_date: {
        label: 'Due Date',
        description: 'When the assignment must be completed.',
        required: true,
      },
      description: {
        label: 'Instructions & Details',
        description: 'Detailed instructions, exercises, and textbook references.',
        example: 'Complete questions 1 to 10 on page 84. Show full steps in your rough notebook.',
        required: true,
      },
    },
    faq: [
      {
        question: 'Can parents see assigned homework?',
        answer: 'Yes! The Parent Portal displays all upcoming and overdue homework tasks so parents can ensure their children complete assignments on time.',
      },
    ],
    relatedLinks: [
      { label: 'Batches', href: '/dashboard/batches' },
    ],
  },

  parents: {
    id: 'parents',
    title: 'Parents & Parent Portal Access',
    category: 'Communication',
    shortSummary: 'Manage parent contacts, connect parents to their children, and enable the secure Parent Portal.',
    whyItExists: 'Parents are your primary partners in student success. TutorPulse allows you to store parent contact information and optionally invite them to a dedicated, read-only Parent Portal.',
    whatToDoFirst: [
      'Add a parent record with their name, phone number, and email address.',
      'Link the parent to their child (or multiple children).',
      'When portal access is enabled, the parent logs in using their email to see their child’s progress.',
    ],
    keyConcepts: [
      {
        term: 'Privacy & Boundary Rules',
        explanation: 'Parents can ONLY see records belonging to their linked children. They can NEVER see other students, other parents, or your private tutor notes.',
      },
      {
        term: 'Parent Portal',
        explanation: 'A clean, dedicated web interface where parents can monitor attendance, homework, test results, fee dues, and batch announcements.',
      },
      {
        term: 'Email Linking',
        explanation: 'Parent Portal authentication uses the parent’s email address. When they sign up or sign in, TutorPulse matches their email to connect their child’s data.',
      },
    ],
    recommendedWorkflow: [
      'Enter parent contact information when enrolling a student.',
      'Link the parent to the student record.',
      'Inform the parent they can log in at tutor-pulse.vercel.app with their email to view their child’s daily updates.',
    ],
    commonMistakes: [
      {
        mistake: 'Using a fake or incorrect email address for the parent.',
        solution: 'Ensure the email is accurate so the parent can log in to the Parent Portal.',
      },
    ],
    fieldGuides: {
      name: {
        label: 'Parent Name',
        description: 'Full name of the parent or guardian.',
        example: 'Priya Sharma',
        required: true,
      },
      phone: {
        label: 'Phone Number',
        description: 'Mobile number for phone calls or messages.',
        example: '+91 98765 43210',
        required: true,
      },
      email: {
        label: 'Email Address (for Portal Login)',
        description: 'Required if the parent will use the Parent Portal.',
        example: 'priya.sharma@example.com',
        required: false,
      },
      relationship: {
        label: 'Relationship',
        description: 'Father, Mother, Guardian, etc.',
        example: 'Mother',
        required: false,
      },
    },
    faq: [
      {
        question: 'What can a parent see in their portal?',
        answer: 'Parents can see their child’s attendance history, test scores, homework assignments, upcoming class schedules, fee dues and receipts, and announcements.',
      },
      {
        question: 'Can parents edit any data?',
        answer: 'No. The Parent Portal is completely read-only. Only you as the tutor can edit records.',
      },
    ],
    relatedLinks: [
      { label: 'Students', href: '/dashboard/students' },
      { label: 'Communication', href: '/dashboard/communication' },
    ],
  },

  communication: {
    id: 'communication',
    title: 'Communication & Announcements',
    category: 'Communication',
    shortSummary: 'Broadcast announcements to batches and manage tutor notifications.',
    whyItExists: 'Eliminates repetitive one-on-one text messages. When you need to notify an entire class about a rescheduled test or holiday, post an announcement once and all enrolled parents see it.',
    whatToDoFirst: [
      'Click "New Announcement".',
      'Select whether it applies to all batches or a specific batch.',
      'Type your title and announcement message.',
      'Publish so parents can read it in their portal.',
    ],
    keyConcepts: [
      {
        term: 'In-App Announcements',
        explanation: 'Broadcast notices visible to parents inside their portal under the Announcements tab.',
      },
      {
        term: 'System Notifications',
        explanation: 'Automatic alerts generated for you (e.g. pending attendance, overdue fee dues).',
      },
      {
        term: 'External Messaging Notice',
        explanation: 'TutorPulse currently manages in-app announcements and alerts. Direct automated WhatsApp messaging is planned for a future release.',
      },
    ],
    recommendedWorkflow: [
      'Post notices about upcoming revisions, holidays, or schedule changes at least 24 hours in advance.',
      'Check system notifications daily to resolve any pending tasks.',
    ],
    commonMistakes: [
      {
        mistake: 'Assuming a draft announcement was published.',
        solution: 'Make sure to click "Publish Announcement" so it appears on the parent portal.',
      },
    ],
    faq: [
      {
        question: 'Can parents reply to announcements inside TutorPulse?',
        answer: 'Announcements are broadcast messages. If parents need to discuss something, they can call or message you directly using your contact details.',
      },
    ],
    relatedLinks: [
      { label: 'Batches', href: '/dashboard/batches' },
    ],
  },

  reports: {
    id: 'reports',
    title: 'Analytics & Performance Reports',
    category: 'Insights',
    shortSummary: 'Review attendance rates, fee collection percentages, and academic performance trends.',
    whyItExists: 'Helps you understand the health of your tuition practice. You can easily spot students whose attendance is slipping or identify parents with overdue fees before it becomes a problem.',
    whatToDoFirst: [
      'Select your time range: This Month, Last Month, or All Time.',
      'Review your Overall Attendance Rate.',
      'Review your Fee Collection Rate and outstanding balance.',
      'Export or review individual student performance tables.',
    ],
    keyConcepts: [
      {
        term: 'Attendance Rate',
        explanation: 'Percentage of total classes attended by enrolled students across the selected timeframe.',
      },
      {
        term: 'Fee Collection Efficiency',
        explanation: 'The ratio of collected tuition fees versus total fees billed.',
      },
      {
        term: 'Batch Averages',
        explanation: 'Comparative benchmarks showing how different cohorts are performing.',
      },
    ],
    recommendedWorkflow: [
      'Review reports at the end of each month.',
      'Identify students with attendance below 75% and speak with their parents.',
      'Follow up on outstanding fee balances.',
    ],
    commonMistakes: [
      {
        mistake: 'Checking reports before marking attendance and fees.',
        solution: 'Analytics reflect real data. Keep attendance and fee records up to date for reliable metrics.',
      },
    ],
    faq: [
      {
        question: 'How often should I review my analytics?',
        answer: 'A weekly check on pending fees and a monthly review of attendance and academic trends is recommended for solo tutors.',
      },
    ],
    relatedLinks: [
      { label: 'Attendance', href: '/dashboard/attendance' },
      { label: 'Fees', href: '/dashboard/fees' },
    ],
  },

  settings: {
    id: 'settings',
    title: 'Settings & Tutor Profile',
    category: 'Account',
    shortSummary: 'Configure your tutor name, email, password, and tuition preferences.',
    whyItExists: 'Keep your account secure, update your display name, and manage your tuition center identity.',
    whatToDoFirst: [
      'Verify your full name and display information.',
      'Change your password or request a password reset if needed.',
      'Manage security and sign-out options.',
    ],
    keyConcepts: [
      {
        term: 'Tutor Profile',
        explanation: 'Your identity in TutorPulse. The name you enter here is shown on announcements and in the parent portal.',
      },
      {
        term: 'Google Sign-In Account',
        explanation: 'If you use Google OAuth, your email is linked through Google for fast, passwordless login.',
      },
    ],
    recommendedWorkflow: [
      'Keep your display name up to date.',
      'Use a strong, unique password if using email/password authentication.',
    ],
    commonMistakes: [
      {
        mistake: 'Leaving default generic names like "Tutor".',
        solution: 'Enter your real name or tuition center name so parents recognize you immediately.',
      },
    ],
    faq: [
      {
        question: 'How do I change my password?',
        answer: 'Click "Send Password Reset Link" in the Settings page. You will receive an email to securely update your password.',
      },
    ],
    relatedLinks: [
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
}

/**
 * Searches help topics, key concepts, FAQs, and field guides by query string.
 */
export function searchHelp(query: string): { topic: HelpTopic; matchReason: string }[] {
  if (!query || !query.trim()) return []
  const clean = query.toLowerCase().trim()
  const results: { topic: HelpTopic; matchReason: string }[] = []

  for (const topic of Object.values(HELP_TOPICS)) {
    let match = ''
    if (topic.title.toLowerCase().includes(clean)) {
      match = `Matched title: "${topic.title}"`
    } else if (topic.shortSummary.toLowerCase().includes(clean)) {
      match = `Matched summary: "${topic.shortSummary.slice(0, 60)}..."`
    } else if (topic.keyConcepts.some((k) => k.term.toLowerCase().includes(clean) || k.explanation.toLowerCase().includes(clean))) {
      const concept = topic.keyConcepts.find((k) => k.term.toLowerCase().includes(clean) || k.explanation.toLowerCase().includes(clean))
      match = `Matched concept: "${concept?.term}"`
    } else if (topic.faq.some((f) => f.question.toLowerCase().includes(clean) || f.answer.toLowerCase().includes(clean))) {
      const f = topic.faq.find((item) => item.question.toLowerCase().includes(clean) || item.answer.toLowerCase().includes(clean))
      match = `Matched FAQ: "${f?.question}"`
    } else if (topic.fieldGuides && Object.entries(topic.fieldGuides).some(([k, v]) => k.includes(clean) || v.label.toLowerCase().includes(clean) || v.description.toLowerCase().includes(clean))) {
      match = 'Matched form field explanation'
    }

    if (match) {
      results.push({ topic, matchReason: match })
    }
  }

  return results
}

/**
 * Resolves the most relevant help topic for a given pathname route.
 */
export function getHelpTopicForRoute(pathname: string): HelpTopic {
  if (pathname.includes('/students')) return HELP_TOPICS.students
  if (pathname.includes('/batches')) return HELP_TOPICS.batches
  if (pathname.includes('/calendar')) return HELP_TOPICS.calendar
  if (pathname.includes('/attendance')) return HELP_TOPICS.attendance
  if (pathname.includes('/tests')) return HELP_TOPICS.tests
  if (pathname.includes('/fees')) return HELP_TOPICS.fees
  if (pathname.includes('/homework')) return HELP_TOPICS.homework
  if (pathname.includes('/parents')) return HELP_TOPICS.parents
  if (pathname.includes('/communication')) return HELP_TOPICS.communication
  if (pathname.includes('/reports')) return HELP_TOPICS.reports
  if (pathname.includes('/settings')) return HELP_TOPICS.settings
  if (pathname.startsWith('/parent')) return HELP_TOPICS.parents
  return HELP_TOPICS.dashboard
}
