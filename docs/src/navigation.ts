export interface NavItem {
  title: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: '🏠',
  },
  {
    title: 'Getting Started',
    path: '/getting-started',
    icon: '🚀',
    children: [
      { title: 'Installation', path: '/getting-started/installation' },
      { title: 'Quick Start', path: '/getting-started/quickstart' },
    ],
  },
  {
    title: 'Workflow',
    path: '/workflow',
    icon: '⚙️',
    children: [
      { title: 'Detect', path: '/workflow/detect' },
      { title: 'Analyze', path: '/workflow/analyze' },
      { title: 'Migrate', path: '/workflow/migrate' },
      { title: 'Validate', path: '/workflow/validate' },
    ],
  },
  {
    title: 'Migration Targets',
    path: '/targets',
    icon: '🎯',
    children: [
      { title: 'Traefik v3', path: '/targets/traefik' },
      { title: 'Gateway API', path: '/targets/gateway-api' },
    ],
  },
  {
    title: 'CLI Reference',
    path: '/cli',
    icon: '💻',
  },
  {
    title: 'API Reference',
    path: '/api',
    icon: '📡',
  },
  {
    title: 'Architecture',
    path: '/architecture',
    icon: '🏗️',
  },
  {
    title: 'Contributing',
    path: '/contributing',
    icon: '🤝',
  },
];
