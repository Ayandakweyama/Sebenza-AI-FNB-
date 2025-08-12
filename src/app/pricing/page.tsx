'use client';

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-white mb-6">Pricing Plans</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Choose the perfect plan for your job search needs
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto py-8">
        {/* Free Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50">
          <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
          <p className="text-4xl font-bold text-white mb-6">R0<span className="text-lg text-gray-400">/month</span></p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Basic CV Builder
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> 1 ATS Score Check
            </li>
            <li className="flex items-center text-gray-400">
              <span className="text-gray-500 mr-2">✗</span> Advanced Analytics
            </li>
            <li className="flex items-center text-gray-400">
              <span className="text-gray-500 mr-2">✗</span> Priority Support
            </li>
          </ul>
          <button className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-8 border border-blue-500/30 transform scale-105 relative">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
            POPULAR
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
          <p className="text-4xl font-bold text-white mb-6">R149<span className="text-lg text-blue-200">/month</span></p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Advanced CV Builder
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Unlimited ATS Checks
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Job Matching
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Email Support
            </li>
          </ul>
          <button className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all transform hover:scale-105">
            Start Free Trial
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50">
          <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
          <p className="text-4xl font-bold text-white mb-6">Custom</p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Everything in Pro
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Custom Integrations
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> Dedicated Support
            </li>
            <li className="flex items-center text-gray-300">
              <span className="text-green-400 mr-2">✓</span> API Access
            </li>
          </ul>
          <button className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            Contact Sales
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-16 p-8 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              question: "Can I change plans later?",
              answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
            },
            {
              question: "Is there a free trial?",
              answer: "Yes, we offer a 14-day free trial for our Pro plan with no credit card required."
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards, PayPal, and EFT bank transfers. All prices are in South African Rand (ZAR)."
            },
            {
              question: "How do I cancel my subscription?",
              answer: "You can cancel your subscription at any time from your account settings. No hidden fees or penalties."
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-slate-700/50 pb-4">
              <h3 className="text-lg font-medium text-white mb-2">{faq.question}</h3>
              <p className="text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
