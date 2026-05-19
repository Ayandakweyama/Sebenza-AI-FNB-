interface ParsedCV {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  experience: Array<{
    company: string;
    position: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    duration?: string;
  }>;
  skills: string[];
  summary?: string;
}

// Extract experience with improved patterns
export const parseCV = (cvText: string): ParsedCV => {
  const lines = cvText.split('\n').map(line => line.trim()).filter(line => line);
  const parsed: ParsedCV = {
    personalInfo: {},
    experience: [],
    education: [],
    skills: [],
    summary: ''
  };

  // Extract skills (common patterns)
  const skillPatterns = [
    /Skills?:?\s*([^\n]+)/i,
    /Technical Skills?:?\s*([^\n]+)/i,
    /Core Competencies?:?\s*([^\n]+)/i,
    /Expertise?:?\s*([^\n]+)/i
  ];

  for (const pattern of skillPatterns) {
    const match = cvText.match(pattern);
    if (match && match[1]) {
      const skillsText = match[1];
      // Split by common delimiters
      const skills = skillsText.split(/[,;•\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      parsed.skills = [...parsed.skills, ...skills];
    }
  }

  // Extract experience with improved patterns
  const experienceSection = cvText.match(/Experience[:\s*]([\s\S]*?)(?=\n\n|\n[A-Z]|\nEducation|\nSkills|\nSUMMARY|$)/i);
  if (experienceSection && experienceSection[1]) {
    const expLines = experienceSection[1].split('\n').filter(line => line.trim());
    let currentExp: any = {};
    let descriptionLines: string[] = [];
    
    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for date patterns (start of new experience)
      const dateMatch = line.match(/(\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current)/i);
      
      // Check for company name (usually capitalized and not a date)
      const isCompany = line.match(/^[A-Z][a-zA-Z\s&]+(?:\s+(?:Inc|Corp|LLC|Ltd|Pty|Solutions|Technologies|Systems|Group|Company))?\s*$/i) && 
                        !dateMatch && 
                        !line.includes('•') && 
                        !line.includes('-') &&
                        line.length > 2 &&
                        line.length < 50;
      
      // Check for position/title (usually after company)
      const isPosition = line.match(/^(Senior|Lead|Principal|Junior|Associate|Staff|Chief|Head|Director|Manager|Engineer|Developer|Specialist|Consultant|Analyst|Architect|Designer|Coordinator|Administrator)\s+[A-Za-z\s]+/i) ||
                         line.match(/Software\s+(Engineer|Developer|Architect)/i) ||
                         line.match(/Full[-\s]?stack\s+(Developer|Engineer)/i) ||
                         line.match(/Front[-\s]?end\s+(Developer|Engineer)/i) ||
                         line.match(/Back[-\s]?end\s+(Developer|Engineer)/i) ||
                         line.match(/Data\s+(Scientist|Analyst|Engineer)/i) ||
                         line.match(/DevOps\s+(Engineer|Specialist)/i) ||
                         line.match(/Product\s+(Manager|Designer)/i) ||
                         line.match(/Project\s+(Manager|Coordinator)/i) ||
                         line.match(/Business\s+(Analyst|Developer)/i);
      
      // Bullet points for description
      const isBullet = line.match(/^[\s]*[•\-\*]\s*(.+)/);
      
      if (isCompany) {
        // Save previous experience if exists
        if (Object.keys(currentExp).length > 0) {
          if (descriptionLines.length > 0) {
            currentExp.description = descriptionLines.join(' ');
            descriptionLines = [];
          }
          parsed.experience.push(currentExp);
        }
        // Start new experience
        currentExp = { company: line };
        
        // Look ahead for position on next line
        if (i + 1 < expLines.length) {
          const nextLine = expLines[i + 1].trim();
          if (nextLine.match(/^(Senior|Lead|Principal|Junior|Associate|Staff|Chief|Head|Director|Manager|Engineer|Developer|Specialist|Consultant|Analyst|Architect|Designer|Coordinator|Administrator)/i) ||
              nextLine.match(/Software\s+(Engineer|Developer|Architect)/i) ||
              nextLine.match(/Full[-\s]?stack\s+(Developer|Engineer)/i) ||
              nextLine.match(/Front[-\s]?end\s+(Developer|Engineer)/i) ||
              nextLine.match(/Back[-\s]?end\s+(Developer|Engineer)/i) ||
              nextLine.match(/Data\s+(Scientist|Analyst|Engineer)/i) ||
              nextLine.match(/DevOps\s+(Engineer|Specialist)/i)) {
            currentExp.position = nextLine;
            i++; // Skip next line as we've processed it
          }
        }
      }
      else if (isPosition && currentExp.company && !currentExp.position) {
        currentExp.position = line;
      }
      else if (dateMatch && currentExp.company) {
        currentExp.duration = line;
      }
      else if (isBullet && currentExp.company) {
        const bulletContent = isBullet[1];
        descriptionLines.push(bulletContent);
      }
      else if (currentExp.company && !currentExp.position && line.length < 60) {
        // Might be a position without common keywords
        currentExp.position = line;
      }
    }
    
    // Save the last experience
    if (Object.keys(currentExp).length > 0) {
      if (descriptionLines.length > 0) {
        currentExp.description = descriptionLines.join(' ');
      }
      parsed.experience.push(currentExp);
    }
  }

  // Extract education
  const educationSection = cvText.match(/Education[:\s*]([\s\S]*?)(?=\n\n|\nExperience|\nSkills|\nSUMMARY|$)/i);
  if (educationSection && educationSection[1]) {
    const eduLines = educationSection[1].split('\n').filter(line => line.trim());
    let currentEdu: any = {};
    
    for (const line of eduLines) {
      if (line.match(/University|College|Institute|School/i)) {
        if (Object.keys(currentEdu).length > 0) {
          parsed.education.push(currentEdu);
        }
        currentEdu = { institution: line.trim() };
      }
      else if (line.match(/Bachelor|Master|PhD|BSc|MSc|BA|MA|BEng|MEng|Diploma|Certificate/i)) {
        currentEdu.degree = line.trim();
      }
      else if (line.match(/in\s+[A-Z][a-zA-Z\s]+/i)) {
        currentEdu.field = line.replace(/^in\s+/i, '').trim();
      }
      else if (line.match(/\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)) {
        currentEdu.duration = line.trim();
      }
    }
    
    if (Object.keys(currentEdu).length > 0) {
      parsed.education.push(currentEdu);
    }
  }

  // Extract contact info
  const emailMatch = cvText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    parsed.personalInfo.email = emailMatch[0];
  }

  const phoneMatch = cvText.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    parsed.personalInfo.phone = phoneMatch[0];
  }

  // Extract name (usually first line, capitalized)
  const firstLine = lines[0];
  if (firstLine && firstLine.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
    parsed.personalInfo.name = firstLine;
  }

  // Extract summary/objective
  const summaryMatch = cvText.match(/(Summary|Objective|Profile|Professional Summary)[:\s*]([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nExperience|\nEducation|\nSkills|$)/i);
  if (summaryMatch && summaryMatch[2]) {
    parsed.summary = summaryMatch[2].trim();
  }

  // Remove duplicate skills and clean up
  parsed.skills = [...new Set(parsed.skills.map(skill => skill.toLowerCase().replace(/[:\-\*]/g, '').trim()))]
    .filter(skill => skill.length > 0);

  return parsed;
};

// Extract skills from CV text using keyword matching
export const extractSkillsFromCV = (cvText: string): string[] => {
  const techSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'Scala', 'Perl', 'R', 'MATLAB', 'Dart', 'Lua', 'Objective-C',
    
    // Frontend Technologies
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby', 'HTML', 'CSS', 'SASS', 'SCSS',
    'Tailwind', 'Bootstrap', 'Material-UI', 'Chakra UI', 'Ant Design', 'Redux', 'MobX', 'GraphQL',
    
    // Backend Technologies
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails', 'FastAPI', 'NestJS',
    'ASP.NET', 'Hapi', 'Koa', 'LoopBack', 'Mongoose', 'Sequelize', 'Prisma', 'TypeORM',
    
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'SQLite',
    'Oracle', 'SQL Server', 'MariaDB', 'Neo4j', 'Couchbase', 'Firebird',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'DigitalOcean', 'Heroku', 'Vercel', 'Netlify',
    'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible',
    'Puppet', 'Chef', 'Nginx', 'Apache', 'Varnish', 'CDN', 'Load Balancer',
    
    // Tools & Platforms
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Teams', 'Zoom',
    'VS Code', 'IntelliJ', 'Eclipse', 'Xcode', 'Android Studio', 'Postman', 'Fiddler',
    
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'Waterfall', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'Pair Programming',
    
    // Data & Analytics
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Apache Spark',
    'Tableau', 'Power BI', 'Looker', 'Google Analytics', 'Mixpanel', 'Segment',
    
    // Security
    'OAuth', 'JWT', 'SSL', 'TLS', 'HTTPS', 'Encryption', 'Authentication', 'Authorization',
    'OWASP', 'Penetration Testing', 'Security Auditing', 'Vulnerability Assessment',
    
    // Testing
    'Jest', 'Mocha', 'Chai', 'Jasmine', 'Karma', 'Selenium', 'Cypress', 'Playwright',
    'Unit Testing', 'Integration Testing', 'E2E Testing', 'Test-Driven Development',
    
    // Architecture & Design
    'Microservices', 'Serverless', 'REST API', 'GraphQL', 'gRPC', 'WebSockets',
    'Event-Driven Architecture', 'CQRS', 'Domain-Driven Design', 'Clean Architecture',
    
    // Performance & Optimization
    'Caching', 'CDN', 'Lazy Loading', 'Code Splitting', 'Tree Shaking', 'Minification',
    'Performance Monitoring', 'APM', 'New Relic', 'DataDog', 'Splunk', 'ELK Stack'
  ];

  const foundSkills: string[] = [];
  const cvTextLower = cvText.toLowerCase();

  techSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    // Check for exact match or partial match
    if (cvTextLower.includes(skillLower) || 
        cvTextLower.includes(skillLower.replace(/\./g, '')) ||
        cvTextLower.includes(skillLower.replace(/\s+/g, ''))) {
      foundSkills.push(skill);
    }
  });

  // Remove duplicates and return
  return [...new Set(foundSkills)];
};
