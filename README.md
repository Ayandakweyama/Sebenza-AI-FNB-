# Sebenza AI - Career Development Platform


Sebenza AI is a comprehensive career development platform that helps job seekers in South Africa and beyond to enhance their job search, create professional CVs, and receive AI-powered career advice.

## ✨ Features

- **AI-Powered CV Builder**: Create professional CVs with smart suggestions
- **Job Search Integration**: Scrape and analyze job listings from multiple sources
- **Career Advice**: Get personalized career guidance based on your experience level
- **Skill Matching**: See how well your skills match job requirements
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A modern web browser
- (Optional) Clerk account for authentication

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sebenza-ai.git
   cd sebenza-ai/sebenza-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_database_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: MongoDB
- **AI & LLM**: 
  - **DeepSeek**: Advanced language model integration for natural language processing
  - **LangChain**: Framework for developing applications powered by language models
- **Type Safety**: TypeScript
- **Form Handling**: React Hook Form
- **State Management**: React Context API
- **Icons**: Lucide Icons

## 📂 Project Structure

```
sebenza-ai/
├── src/
│   ├── app/                    # App router pages
│   ├── components/             # Reusable components
│   ├── lib/                    # Utility functions and configurations
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
└── .gitignore                 # Git ignore file
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Clerk](https://clerk.com/) for authentication
- All the open-source libraries used in this project
