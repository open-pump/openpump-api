'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, Code, Zap, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/guides/quick-start', icon: Zap },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Overview', href: '/docs/api', icon: Book },
      { title: 'Tokens Endpoint', href: '/docs/api/tokens', icon: Code },
      { title: 'Metadata Endpoint', href: '/docs/api/metadata', icon: FileText },
      { title: 'Pricing Endpoint', href: '/docs/api/pricing', icon: FileText },
      { title: 'Bonding Curve', href: '/docs/api/bonding', icon: FileText },
      { title: 'Simulation', href: '/docs/api/simulation', icon: FileText },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Building a Trading Bot', href: '/docs/guides/building-a-bot' },
      { title: 'Rate Limits', href: '/docs/guides/rate-limits' },
      { title: 'Error Handling', href: '/docs/guides/error-handling' },
    ],
  },
  {
    title: 'Examples',
    items: [
      { title: 'Code Examples', href: '/docs/examples' },
      { title: 'Use Cases', href: '/docs/examples/use-cases' },
    ],
  },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900">OpenPump</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href="/docs"
                  className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md"
                >
                  Docs
                </Link>
                <Link
                  href="/pricing"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Home
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } md:block w-64 flex-shrink-0`}
          >
            <div className="sticky top-24 space-y-8">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            <span>{item.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
