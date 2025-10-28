'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mb-4">Get in Touch</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Have questions or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="How can we help?"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="Tell us more about how we can help..."
                required
              ></textarea>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all transform hover:scale-105"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
          
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600/20 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Our Office</h3>
                <p className="mt-1 text-gray-400">123 Career Street<br />Joburg, 2000<br />South Africa</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600/20 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Email Us</h3>
                <p className="mt-1 text-blue-400 hover:text-blue-300">
                  <a href="mailto:info@sebenza-ai.com">info@sebenza-ai.com</a>
                </p>
                <p className="mt-1 text-blue-400 hover:text-blue-300">
                  <a href="mailto:support@sebenza-ai.com">support@sebenza-ai.com</a>
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-600/20 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Call Us</h3>
                <p className="mt-1 text-gray-400">+27 12 345 6789</p>
                <p className="text-sm text-gray-500">Mon-Fri from 8am to 5pm</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12">
            <h3 className="text-lg font-medium text-white mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {[
                { name: 'Twitter', url: '#' },
                { name: 'LinkedIn', url: '#' },
                { name: 'Facebook', url: '#' },
                { name: 'Instagram', url: '#' }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{social.name}</span>
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                    {social.name[0]}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
