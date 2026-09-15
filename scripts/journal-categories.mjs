export const CATEGORIES = [
  'Moving to the Riviera',
  'Life as a Newcomer',
  'Riviera Lifestyle',
  'City Guides',
  'Work & Business',
  'Housing & Neighborhoods',
  'Culture & Community',
  'Food & Dining',
  'Events & Festivals',
  'Travel & Transportation',
  'Tips & Resources',
  'Local Services',
  'Legal & Administrative',
  'Cost of Living',
  'Family & Education',
  'Healthcare',
  'Outdoor Activities',
  'Beaches & Nature',
  'Shopping & Markets',
  'History & Heritage',
  'Nightlife',
  'Seasonal Living'
];

export const CATEGORY_ALIASES = {
  'Local businesses': 'Local Services',
  Paperwork: 'Legal & Administrative',
  'Food & markets': 'Food & Dining',
  Walks: 'Outdoor Activities',
  Language: 'Culture & Community'
};

export const DEFAULT_CATEGORY = 'Riviera Lifestyle';

export const RELATED_BY_CATEGORY = {
  'Moving to the Riviera': [
    { href: '/settling-in.html', title: 'Settling in' },
    { href: '/finding-a-home.html', title: "I'll find your place" }
  ],
  'Life as a Newcomer': [
    { href: '/settling-in.html', title: 'Settling in' },
    { href: '/about.html', title: 'About Nathalie' }
  ],
  'Riviera Lifestyle': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/about.html', title: 'About Nathalie' }
  ],
  'City Guides': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/guide-transport.html', title: 'Getting around' }
  ],
  'Work & Business': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/finding-a-home.html', title: "I'll find your place" }
  ],
  'Housing & Neighborhoods': [
    { href: '/finding-a-home.html', title: "I'll find your place" },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'Culture & Community': [
    { href: '/guide-french.html', title: 'Learning French' },
    { href: '/about.html', title: 'About Nathalie' }
  ],
  'Food & Dining': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'Events & Festivals': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/about.html', title: 'About Nathalie' }
  ],
  'Travel & Transportation': [
    { href: '/guide-transport.html', title: 'Getting around' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'Tips & Resources': [
    { href: '/settling-in.html', title: 'Settling in' },
    { href: '/contact.html', title: 'Contact' }
  ],
  'Local Services': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'Legal & Administrative': [
    { href: '/guide-visas.html', title: 'Visas & residency' },
    { href: '/settling-in.html', title: 'Settling in' }
  ],
  'Cost of Living': [
    { href: '/settling-in.html', title: 'Settling in' },
    { href: '/finding-a-home.html', title: "I'll find your place" }
  ],
  'Family & Education': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/settling-in.html', title: 'Settling in' }
  ],
  Healthcare: [
    { href: '/guide-healthcare.html', title: 'Healthcare' },
    { href: '/settling-in.html', title: 'Settling in' }
  ],
  'Outdoor Activities': [
    { href: '/guide-transport.html', title: 'Getting around' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'Beaches & Nature': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/guide-transport.html', title: 'Getting around' }
  ],
  'Shopping & Markets': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  'History & Heritage': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/about.html', title: 'About Nathalie' }
  ],
  Nightlife: [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/guide-businesses.html', title: 'Local businesses' }
  ],
  'Seasonal Living': [
    { href: '/neighborhoods.html', title: 'Neighborhoods' },
    { href: '/settling-in.html', title: 'Settling in' }
  ]
};

export function canonicalCategory(value) {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_CATEGORY;
  if (CATEGORIES.includes(raw)) return raw;
  if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];
  return raw;
}
