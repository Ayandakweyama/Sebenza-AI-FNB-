import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Twitter, Github, Mail, ArrowRight, Sparkles } from 'lucide-react';
import FooterStarsCanvas from './FooterStarsCanvas';

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { title: 'Product', links: [{ name: 'Features', href: '/features' }, { name: 'Pricing', href: '/pricing' }, { name: 'Testimonials', href: '/#testimonials' }] },
    { title: 'Company', links: [{ name: 'About Us', href: '/about' }, { name: 'Careers', href: '/careers' }, { name: 'Contact', href: '/contact' }] },
    { title: 'Resources', links: [{ name: 'Blog', href: '/blog' }, { name: 'Help Center', href: '/help' }, { name: 'Documentation', href: '/docs' }] },
  ];

  const socialLinks = [
    { name: 'GitHub',   href: 'https://github.com/yourusername/sebenza-ai', Icon: Github },
    { name: 'Twitter',  href: 'https://twitter.com/sebenza_ai',              Icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/sebenza-ai',     Icon: Linkedin },
    { name: 'Email',    href: 'mailto:contact@sebenza-ai.com',               Icon: Mail },
  ];

  return (
    <>
      <style>{`
        @keyframes gradient-shift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes blob            { 0%,100%{border-radius:60% 40% 55% 45%/60% 55% 45% 40%} 33%{border-radius:40% 60% 45% 55%/45% 40% 60% 55%} 66%{border-radius:55% 45% 60% 40%/55% 60% 40% 45%} }
        @keyframes float-footer    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes nebula-drift    { 0%,100%{opacity:.55;transform:scale(1) translate(0,0)} 50%{opacity:.8;transform:scale(1.06) translate(-6px,-4px)} }
        @keyframes ring-spin       { to{transform:rotateX(68deg) rotateZ(360deg)} }
        @keyframes ring-spin-rev   { to{transform:rotateX(50deg) rotateZ(-360deg)} }
        @keyframes shine-sweep     { 0%{left:-100%} 100%{left:200%} }
        @keyframes social-glow     { 0%,100%{box-shadow:0 0 0 0 rgba(168,85,247,0)} 50%{box-shadow:0 0 16px 2px rgba(168,85,247,.4)} }

        .footer-card {
          animation: float-footer 7s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 1000px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.07),
            0 30px 80px rgba(10,5,40,.7),
            0 0 60px rgba(139,92,246,.15),
            inset 0 1px 0 rgba(255,255,255,.09),
            inset 0 -1px 0 rgba(139,92,246,.12);
          transition: box-shadow .4s ease;
        }
        .footer-card:hover {
          box-shadow:
            0 0 0 1px rgba(255,255,255,.1),
            0 40px 100px rgba(10,5,40,.8),
            0 0 90px rgba(139,92,246,.25),
            inset 0 1px 0 rgba(255,255,255,.12),
            inset 0 -1px 0 rgba(139,92,246,.18);
        }
        .footer-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          color: rgba(209,213,219,.65);
          transition: color .2s ease;
        }
        .footer-link::after {
          content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px;
          background: linear-gradient(90deg,rgba(168,85,247,.8),rgba(236,72,153,.6));
          transition: width .3s ease;
        }
        .footer-link:hover { color: rgba(255,255,255,.95); }
        .footer-link:hover::after { width: 100%; }
        .footer-link .arrow { opacity:0; transform:translateX(-4px); transition:opacity .2s,transform .2s; }
        .footer-link:hover .arrow { opacity:1; transform:translateX(0); }

        .social-btn {
          display:flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:50%;
          border:1px solid rgba(255,255,255,.1);
          background:rgba(255,255,255,.04);
          color:rgba(209,213,219,.65);
          transition:color .2s,border-color .2s,background .2s,transform .2s;
          position:relative; overflow:hidden;
        }
        .social-btn:hover {
          color:white; border-color:rgba(168,85,247,.6);
          background:rgba(168,85,247,.12);
          transform:translateY(-3px) scale(1.08);
          animation:social-glow 1.4s ease-in-out infinite;
        }
        .social-btn::before {
          content:''; position:absolute; inset:0; border-radius:50%;
          background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.14),transparent 60%);
        }

        .section-title {
          font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase;
          background:linear-gradient(90deg,rgba(168,85,247,.9),rgba(236,72,153,.7));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          margin-bottom:16px;
        }

        .divider-line {
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(168,85,247,.35),rgba(236,72,153,.25),rgba(59,130,246,.2),transparent);
        }

        .cta-band {
          position:relative; overflow:hidden;
          border-radius:16px;
          padding:20px 24px;
          background:linear-gradient(135deg,rgba(139,92,246,.14) 0%,rgba(168,85,247,.08) 50%,rgba(59,130,246,.1) 100%);
          border:1px solid rgba(168,85,247,.22);
          margin-bottom:32px;
        }
        .cta-band::before {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
          animation:shine-sweep 4s ease-in-out infinite;
        }

        .orbit-wrap { position:absolute; inset:0; pointer-events:none; }
        .orbit { position:absolute; inset:0; margin:auto; border-radius:50%; border:1px solid; }
      `}</style>

      <footer
        className="relative overflow-hidden bg-[#050615]"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '620px' }}
      >

        {/* Starfield */}
        <FooterStarsCanvas />

        {/* Colour wash */}
        <div className="absolute inset-0 animate-[gradient-shift_14s_ease_infinite] [background-size:200%_200%]" style={{
          backgroundImage: 'radial-gradient(circle_at_15%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.14),transparent_55%)',
          zIndex: 2,
        }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ zIndex: 2, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '26px 26px', backgroundPosition: '0 0' }} />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ zIndex: 2, backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 1px,transparent 1px)', backgroundSize: '64px 64px', backgroundPosition: '12px 18px' }} />

        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <div className="absolute -top-24 left-[-120px] w-[420px] h-[420px] bg-purple-500/25 rounded-full blur-3xl animate-[blob_11s_ease-in-out_infinite]" />
          <div className="absolute top-[-80px] right-[-140px] w-[480px] h-[480px] bg-pink-500/20 rounded-full blur-3xl animate-[blob_9s_ease-in-out_infinite_2s]" />
          <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/15 rounded-full blur-3xl animate-[blob_12s_ease-in-out_infinite_4s]" />
        </div>

        {/* Horizon glow */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ zIndex: 2, background: 'linear-gradient(to top, rgba(80,20,180,.2), transparent)' }} />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14" style={{ zIndex: 10 }}>
          <div
            className="footer-card relative rounded-3xl px-6 py-10 sm:px-10"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,.05) 0%, rgba(100,50,200,.06) 50%, rgba(255,255,255,.03) 100%)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
          >
            {/* Top rim light */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl" style={{ background: 'linear-gradient(90deg,transparent,rgba(200,140,255,.55),rgba(236,72,153,.3),transparent)' }} />
            {/* Bottom rim light */}
            <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl" style={{ background: 'linear-gradient(90deg,transparent,rgba(100,80,255,.3),transparent)' }} />
            {/* Corner accent top-left */}
            <div className="absolute top-0 left-0 w-24 h-24 rounded-tl-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 0%, rgba(168,85,247,.18), transparent 70%)' }} />
            {/* Corner accent bottom-right */}
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-br-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 100%, rgba(59,130,246,.14), transparent 70%)' }} />

            {/* Floating orbital rings (decorative) */}
            <div className="absolute top-[-20px] right-[60px] w-[120px] h-[120px] pointer-events-none opacity-30" style={{ perspective: '600px' }}>
              <div className="orbit" style={{ width:'110px',height:'110px',borderColor:'rgba(168,85,247,.5)',animation:'ring-spin 16s linear infinite' }} />
              <div className="orbit" style={{ width:'80px',height:'80px',borderColor:'rgba(236,72,153,.4)',animation:'ring-spin-rev 10s linear infinite' }} />
            </div>

            {/* CTA strip */}
            <div className="cta-band">
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm leading-tight">Ready to accelerate your career?</p>
                    <p className="text-gray-400 text-xs mt-0.5">Join thousands already landing dream jobs with Sebenza AI.</p>
                  </div>
                </div>
                <Link
                  href="/signup"
                  prefetch={false}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,.9), rgba(168,85,247,.8))',
                    boxShadow: '0 0 20px rgba(168,85,247,.35), inset 0 1px 0 rgba(255,255,255,.15)',
                    border: '1px solid rgba(168,85,247,.4)',
                  }}
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Main grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">

              {/* Brand col */}
              <div className="md:col-span-1">
                <Link href="/dashboard" prefetch={false} className="inline-block group">
                  <div
                    className="relative h-16 w-16 md:h-18 md:w-18 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      filter: 'drop-shadow(0 0 12px rgba(168,85,247,.45))',
                      transition: 'filter .3s ease, transform .3s ease',
                    }}
                  >
                    <Image src="/images/logonobg.png" alt="Sebenza AI" width={72} height={72} loading="lazy" className="h-full w-full object-contain" />
                  </div>
                </Link>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(209,213,219,.7)' }}>
                  AI-powered tools to accelerate your job search and career growth. Get matched with your dream job using advanced AI technology.
                </p>

                <div className="flex items-center gap-2.5 mt-6">
                  {socialLinks.map(({ name, href, Icon }) => (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label={name}>
                      <Icon className="w-4 h-4 relative z-10" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Link cols */}
              {footerLinks.map((section) => (
                <div key={section.title}>
                  <h3 className="section-title">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((item) => (
                      <li key={item.name}>
                        <Link href={item.href} prefetch={false} className="footer-link text-sm">
                          <ArrowRight className="arrow w-3 h-3 mr-1.5 text-purple-400" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="divider-line my-8" />

            {/* Bottom bar */}
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs" style={{ color: 'rgba(156,163,175,.45)' }}>
                &copy; {currentYear} Sebenza AI. All rights reserved.
              </p>

              {/* Subtle orbit decoration */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none opacity-20" style={{ perspective: '400px' }}>
                <div style={{ width:'60px',height:'60px',border:'1px solid rgba(168,85,247,.6)',borderRadius:'50%',animation:'ring-spin 20s linear infinite' }} />
              </div>

              <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(156,163,175,.55)' }}>
                {[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Cookie Policy','/cookies']].map(([label, href], i, arr) => (
                  <span key={label} className="flex items-center gap-1">
                    <Link href={href} prefetch={false} className="footer-link text-xs" style={{ color: 'rgba(156,163,175,.55)' }}>{label}</Link>
                    {i < arr.length - 1 && <span className="opacity-30">·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
