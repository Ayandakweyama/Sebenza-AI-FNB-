'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Twitter, Github, Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Testimonials', href: '/#testimonials' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/blog' },
        { name: 'Help Center', href: '/help' },
        { name: 'Documentation', href: '/docs' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/yourusername/sebenza-ai',
      icon: <Github className="w-5 h-5" />,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/sebenza_ai',
      icon: <Twitter className="w-5 h-5" />,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/sebenza-ai',
      icon: <Linkedin className="w-5 h-5" />,
    },
    {
      name: 'Email',
      href: 'mailto:contact@sebenza-ai.com',
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative h-16 w-16 md:h-20 md:w-20 transition-all duration-300 transform">
                <Image 
                  src="/images/logonobg.png" 
                  alt="Sebenza AI"
                  width={80}
                  height={80}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>
            <p className="mt-4 text-slate-400 max-w-md">
              AI-powered tools to accelerate your job search and career growth. 
              Get matched with your dream job using our advanced AI technology.
            </p>
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label={item.name}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-slate-400 hover:text-white transition-colors flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} Sebenza AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-slate-400 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white text-sm">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-slate-400 hover:text-white text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;