/**
 * TaskFlow Pro - Default Sample Tasks & Initial Dataset
 */

const defaultTasks = [
  {
    id: "task-1",
    title: "Design System & UI Architecture Review",
    description: "Review component tokens, typography hierarchy, accessibility contrast, and dark mode palette for the upcoming release.",
    category: "Work",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], // Tomorrow
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: null
  },
  {
    id: "task-2",
    title: "Implement Horizontal Pod Autoscaling on Kubernetes",
    description: "Deploy Helm chart with Prometheus metrics server and test traffic surge thresholds on staging cluster.",
    category: "Study",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: null
  },
  {
    id: "task-3",
    title: "Weekly Grocery & Meal Preparation",
    description: "Pick up fresh fruits, oat milk, vegetables, Greek yogurt, and prep lunch boxes for Monday through Thursday.",
    category: "Personal",
    priority: "medium",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    completedAt: null
  },
  {
    id: "task-4",
    title: "Morning 5km Cardio Run & Mobility Workout",
    description: "Interval sprints at riverside park followed by 15 mins post-run mobility and stretching routine.",
    category: "Health",
    priority: "medium",
    dueDate: new Date().toISOString().split('T')[0], // Today
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "task-5",
    title: "Review Monthly Investment Portfolio & Budget",
    description: "Rebalance index fund contributions, log recurring subscriptions, and update quarterly savings projection.",
    category: "Finance",
    priority: "low",
    dueDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    completedAt: null
  },
  {
    id: "task-6",
    title: "Setup Automated CI/CD Testing Pipeline",
    description: "Configure GitHub Actions workflow for linting, unit test coverage, and Docker image build caching.",
    category: "Work",
    priority: "high",
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Yesterday (Overdue)
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    completedAt: null
  },
  {
    id: "task-7",
    title: "Read 2 Chapters of Clean Code & Refactoring",
    description: "Focus on meaningful names, function purity, and code smells in legacy modules.",
    category: "Study",
    priority: "low",
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    completed: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

const categoryConfig = {
  Work: { icon: 'fa-solid fa-briefcase', label: 'Work', color: '#6366f1' },
  Personal: { icon: 'fa-solid fa-house-user', label: 'Personal', color: '#0ea5e9' },
  Study: { icon: 'fa-solid fa-graduation-cap', label: 'Study', color: '#8b5cf6' },
  Health: { icon: 'fa-solid fa-heart-pulse', label: 'Health', color: '#10b981' },
  Finance: { icon: 'fa-solid fa-wallet', label: 'Finance', color: '#f59e0b' },
  General: { icon: 'fa-solid fa-bolt', label: 'General', color: '#ec4899' }
};

const motivationalQuotes = [
  "Small daily improvements over time lead to stunning results.",
  "Focus on being productive instead of busy.",
  "Action is the foundational key to all success.",
  "Your future is created by what you do today, not tomorrow.",
  "Organize your thoughts, prioritize what matters, and execute."
];
