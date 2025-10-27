import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create sample companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp Solutions',
        industry: 'Technology',
        size: 'large',
        location: 'San Francisco, CA',
        website: 'https://techcorp.example.com',
        description: 'Leading technology solutions provider'
      }
    }),
    prisma.company.create({
      data: {
        name: 'StartupXYZ',
        industry: 'Software',
        size: 'small',
        location: 'New York, NY',
        website: 'https://startupxyz.example.com',
        description: 'Innovative startup in the AI space'
      }
    }),
    prisma.company.create({
      data: {
        name: 'BigTech Inc',
        industry: 'Technology',
        size: 'enterprise',
        location: 'Seattle, WA',
        website: 'https://bigtech.example.com',
        description: 'Global technology leader'
      }
    }),
    prisma.company.create({
      data: {
        name: 'InnovateCo',
        industry: 'Software',
        size: 'medium',
        location: 'Austin, TX',
        website: 'https://innovateco.example.com',
        description: 'Innovation-driven software company'
      }
    }),
    prisma.company.create({
      data: {
        name: 'DataDrive Systems',
        industry: 'Data Analytics',
        size: 'medium',
        location: 'Boston, MA',
        website: 'https://datadrive.example.com',
        description: 'Data analytics and insights platform'
      }
    })
  ]);

  console.log(`Created ${companies.length} companies`);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced Full Stack Developer to join our team...',
        companyId: companies[0].id,
        location: 'San Francisco, CA',
        type: 'full-time',
        level: 'senior',
        salary: '$120,000 - $180,000',
        requirements: '5+ years experience, React, Node.js, TypeScript',
        benefits: 'Health insurance, 401k, Remote work options'
      }
    }),
    prisma.job.create({
      data: {
        title: 'Frontend Engineer',
        description: 'Join our growing team as a Frontend Engineer...',
        companyId: companies[1].id,
        location: 'New York, NY',
        type: 'full-time',
        level: 'mid',
        salary: '$90,000 - $130,000',
        requirements: '3+ years experience, React, TypeScript',
        benefits: 'Equity, Health insurance, Flexible hours'
      }
    }),
    prisma.job.create({
      data: {
        title: 'React Developer',
        description: 'We need a talented React Developer to build amazing user interfaces...',
        companyId: companies[2].id,
        location: 'Remote',
        type: 'full-time',
        level: 'mid',
        salary: '$100,000 - $140,000',
        requirements: 'React, Redux, JavaScript/TypeScript',
        benefits: 'Full remote, Health benefits, Learning budget'
      }
    }),
    prisma.job.create({
      data: {
        title: 'Backend Engineer',
        description: 'Looking for a Backend Engineer to work on scalable systems...',
        companyId: companies[3].id,
        location: 'Austin, TX',
        type: 'full-time',
        level: 'senior',
        salary: '$130,000 - $170,000',
        requirements: 'Node.js, Python, AWS, Microservices',
        benefits: 'Stock options, Health insurance, Gym membership'
      }
    }),
    prisma.job.create({
      data: {
        title: 'Data Engineer',
        description: 'Join our data team to build robust data pipelines...',
        companyId: companies[4].id,
        location: 'Boston, MA',
        type: 'full-time',
        level: 'mid',
        salary: '$110,000 - $150,000',
        requirements: 'Python, SQL, Apache Spark, AWS',
        benefits: 'Health insurance, 401k, Professional development'
      }
    }),
    prisma.job.create({
      data: {
        title: 'DevOps Engineer',
        description: 'We need a DevOps Engineer to improve our infrastructure...',
        companyId: companies[0].id,
        location: 'San Francisco, CA',
        type: 'contract',
        level: 'senior',
        salary: '$150,000 - $200,000',
        requirements: 'Kubernetes, Docker, CI/CD, AWS/GCP',
        benefits: 'Competitive pay, Remote work'
      }
    }),
    prisma.job.create({
      data: {
        title: 'Junior Developer',
        description: 'Great opportunity for a Junior Developer to grow...',
        companyId: companies[1].id,
        location: 'New York, NY',
        type: 'full-time',
        level: 'entry',
        salary: '$60,000 - $80,000',
        requirements: '1+ year experience, JavaScript, HTML/CSS',
        benefits: 'Mentorship, Health insurance, Learning opportunities'
      }
    }),
    prisma.job.create({
      data: {
        title: 'Machine Learning Engineer',
        description: 'Join our AI team to work on cutting-edge ML projects...',
        companyId: companies[2].id,
        location: 'Seattle, WA',
        type: 'full-time',
        level: 'senior',
        salary: '$150,000 - $220,000',
        requirements: 'Python, TensorFlow/PyTorch, ML algorithms',
        benefits: 'Stock options, Health insurance, Conference budget'
      }
    })
  ]);

  console.log(`Created ${jobs.length} jobs`);

  // Note: Applications will be created when users actually apply to jobs
  // This seed file just sets up the basic job listings

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
