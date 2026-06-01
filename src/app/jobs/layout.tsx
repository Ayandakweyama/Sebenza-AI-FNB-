'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, Target } from 'lucide-react';
import { FloatingParticles } from './components/FloatingParticles';

const navItems = [
  {
    name: 'Command Center',
    href: '/jobs',
    icon: LayoutDashboard,
    description: 'AI recruitment dashboard'
  },
  {
    name: 'All Jobs',
    href: '/jobs/all',
    icon: Briefcase,
    description: 'Browse opportunities'
  },
  {
    name: 'Matcher',
    href: '/jobs/matcher',
    icon: Target,
    description: 'AI match scoring'
  },
];

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#050815] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-0 opacity-90"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 78% 62% at 12% 12%, rgba(59,130,246,.20) 0%, transparent 58%),
              radial-gradient(ellipse 64% 58% at 88% 14%, rgba(255,255,255,.07) 0%, transparent 62%),
              radial-gradient(ellipse 70% 60% at 50% 96%, rgba(99,102,241,.16) 0%, transparent 62%)
            `,
          }}
        />
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px)', backgroundSize: '68px 68px', backgroundPosition: '14px 20px' }} />
        <FloatingParticles />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050815]/20 to-[#050815]" />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 text-slate-200 hover:text-white transition-colors"
            >
              <span className="mr-2 text-lg leading-none">←</span>
              Back to Dashboard
            </Link>

            <div className="w-full sm:w-auto mx-auto sm:mx-0 max-w-[520px] rounded-2xl border border-white/10 bg-black/10 backdrop-blur-xl p-2">
              <div className="grid w-full grid-cols-1 min-[420px]:grid-cols-3 gap-2 sm:w-auto sm:flex sm:items-center sm:gap-2 sm:flex-wrap sm:justify-end">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl border text-sm font-semibold transition-all duration-300 sm:px-4 sm:py-2.5',
                        active
                          ? 'bg-white/12 border-white/22 text-white shadow-[0_0_0_1px_rgba(255,255,255,.08),0_18px_50px_rgba(0,0,0,.45)]'
                          : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/8 hover:border-white/18 hover:text-white hover:shadow-[0_14px_40px_rgba(0,0,0,.38)]'
                      ].join(' ')}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span
                        className={[
                          'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
                          active
                            ? 'opacity-100 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,.25),transparent_60%)]'
                            : 'group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,.18),transparent_62%)]'
                        ].join(' ')}
                      />
                      <span className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                        <Icon className="w-4 h-4 opacity-95" />
                      </span>
                      <span className="hidden sm:inline">{item.name}</span>
                      <span className="sm:hidden">{item.href === '/jobs/all' ? 'All Jobs' : item.name.split(' ')[0]}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
