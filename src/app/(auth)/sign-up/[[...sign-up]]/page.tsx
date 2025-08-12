import { SignUp } from "@clerk/nextjs";
 
export default function Page() {
  return (
    <div className="w-full max-w-md">
      <SignUp 
        appearance={{
          elements: {
            card: "bg-slate-900 border border-slate-800 shadow-lg",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "border-gray-700 hover:bg-slate-800",
            socialButtonsBlockButtonText: "text-gray-200",
            dividerLine: "bg-gray-800",
            dividerText: "text-gray-400",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-slate-800 border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            footerActionText: "text-gray-400",
            footerActionLink: "text-blue-400 hover:text-blue-300",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          },
        }}
      />
    </div>
  );
}
