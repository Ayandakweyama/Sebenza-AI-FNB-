import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription & Billing - Sebenza AI',
  description: 'Manage your subscription and billing information.'
};

export default function SubscriptionBillingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Subscription & Billing
        </h1>
        <p className="text-slate-400">
          Manage your subscription plan and payment methods
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Current Plan</h2>
              <p className="text-slate-400">Manage your subscription details</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400">
                Premium Plan
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-400">Billing Cycle</p>
              <p className="text-white font-medium">Monthly</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-400">Next Billing Date</p>
              <p className="text-white font-medium">August 21, 2025</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-400">Next Payment</p>
              <p className="text-white font-medium">R299.00</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button className="px-4 py-2 text-sm border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors">
              Change Plan
            </button>
            <button className="px-4 py-2 text-sm bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-white rounded-lg transition-colors">
              Cancel Subscription
            </button>
          </div>
        </div>
        
        {/* Payment Methods */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
              <p className="text-slate-400">Manage your saved payment methods</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Payment Method
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Credit Card */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-10 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="currentColor"></path>
                      <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#FFF"></path>
                      <path d="M13.5 15.5h8v3h-8z" fill="#0066CC"></path>
                      <path d="M35 8H3v3h32z" fill="#00A0E7"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Visa ending in 4242</h3>
                    <p className="text-sm text-slate-400">Expires 12/25</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* PayPal */}
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-10 h-7 bg-blue-700 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-xs">PayPal</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">PayPal Account</h3>
                    <p className="text-sm text-slate-400">user@example.com</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Billing History */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Billing History</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { id: 1, date: '2025-07-21', description: 'Premium Plan - Monthly', amount: 'R299.00', status: 'Paid' },
                  { id: 2, date: '2025-06-21', description: 'Premium Plan - Monthly', amount: 'R299.00', status: 'Paid' },
                  { id: 3, date: '2025-05-21', description: 'Premium Plan - Monthly', amount: 'R299.00', status: 'Paid' },
                  { id: 4, date: '2025-04-21', description: 'Premium Plan - Monthly', amount: 'R299.00', status: 'Paid' },
                ].map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-300">
                      {invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-emerald-400 hover:text-emerald-300">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button className="px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center">
              View Full Billing History
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Billing Information */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Billing Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Billing Email</h3>
              <div className="flex">
                <input
                  type="email"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  defaultValue="user@example.com"
                />
                <button className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-r-lg transition-colors">
                  Update
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Tax Information</h3>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                  placeholder="VAT/GST Number (if applicable)"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Country</label>
                <select className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white">
                  <option>South Africa</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                  <option>Canada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">ZIP/Postal Code</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white" defaultValue="2000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Address Line 1</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white" defaultValue="123 Job Street" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Address Line 2 (Optional)</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white" placeholder="Apartment, suite, etc." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">City</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white" defaultValue="Johannesburg" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Province/State</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white" defaultValue="Gauteng" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-white hover:opacity-90 transition-opacity">
                Save Billing Information
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
