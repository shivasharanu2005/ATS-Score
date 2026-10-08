/**
 * Skill Normalization Service
 * Standardizes skill representations without merging unrelated technologies.
 * e.g., JS -> JavaScript, ReactJS -> React, Postgres -> PostgreSQL, K8s -> Kubernetes
 */

const SKILL_SYNONYMS: Record<string, string> = {
  // Programming Languages
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'es6': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'py': 'Python',
  'python': 'Python',
  'python3': 'Python',
  'java': 'Java',
  'jdk': 'Java',
  'golang': 'Go',
  'go': 'Go',
  'c++': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'dotnet': '.NET',
  '.net': '.NET',
  'dotnet core': '.NET Core',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'php': 'PHP',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'scala': 'Scala',
  'sql': 'SQL',

  // Frontend Frameworks & Libraries
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'nuxt': 'Nuxt.js',
  'nuxtjs': 'Nuxt.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'svelte': 'Svelte',
  'sveltekit': 'SvelteKit',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'bootstrap': 'Bootstrap',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',
  'redux': 'Redux',
  'zustand': 'Zustand',

  // Backend Frameworks
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'spring': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring framework': 'Spring Boot',
  'django': 'Django',
  'fastapi': 'FastAPI',
  'flask': 'Flask',
  'laravel': 'Laravel',
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'asp.net': 'ASP.NET',

  // Databases & Storage
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'cassandra': 'Cassandra',
  'dynamodb': 'DynamoDB',
  'elasticsearch': 'Elasticsearch',
  'elastic': 'Elasticsearch',
  'sqlite': 'SQLite',

  // Cloud & DevOps
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'aws ec2': 'AWS',
  'aws s3': 'AWS',
  'aws lambda': 'AWS Lambda',
  'gcp': 'Google Cloud (GCP)',
  'google cloud': 'Google Cloud (GCP)',
  'azure': 'Microsoft Azure',
  'docker': 'Docker',
  'docker container': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'terraform': 'Terraform',
  'ansible': 'Ansible',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'jenkins': 'Jenkins',
  'github actions': 'GitHub Actions',
  'gitlab ci': 'GitLab CI',
  'linux': 'Linux',
  'bash': 'Bash/Shell',
  'shell': 'Bash/Shell',

  // APIs & Architecture
  'rest': 'REST API',
  'rest api': 'REST API',
  'restful': 'REST API',
  'restful api': 'REST API',
  'graphql': 'GraphQL',
  'grpc': 'gRPC',
  'microservices': 'Microservices',
  'microservice': 'Microservices',
  'kafka': 'Apache Kafka',
  'apache kafka': 'Apache Kafka',
  'rabbitmq': 'RabbitMQ',
  'git': 'Git',

  // AI & Data Science
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'deep learning': 'Deep Learning',
  'pytorch': 'PyTorch',
  'torch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'keras': 'Keras',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'scikit-learn': 'Scikit-Learn',
  'sklearn': 'Scikit-Learn',
  'nlp': 'NLP',
  'natural language processing': 'NLP',
  'computer vision': 'Computer Vision',
  'opencv': 'OpenCV',
  'llm': 'LLMs',
  'llms': 'LLMs',
  'langchain': 'LangChain',
  'rag': 'RAG'
};

export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const cleaned = skill.trim();
  const lower = cleaned.toLowerCase().replace(/[-_.]/g, ' ').replace(/\s+/g, ' ');
  const exactLower = cleaned.toLowerCase();

  if (SKILL_SYNONYMS[exactLower]) return SKILL_SYNONYMS[exactLower];
  if (SKILL_SYNONYMS[lower]) return SKILL_SYNONYMS[lower];

  // Capitalize nicely if not mapped
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function normalizeSkillsList(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const s of skills) {
    const norm = normalizeSkill(s);
    if (norm && !seen.has(norm.toLowerCase())) {
      seen.add(norm.toLowerCase());
      normalized.push(norm);
    }
  }

  return normalized;
}

export function areSkillsMatching(skillA: string, skillB: string): boolean {
  const normA = normalizeSkill(skillA).toLowerCase();
  const normB = normalizeSkill(skillB).toLowerCase();
  if (normA === normB) return true;
  // Substring matching with safety (e.g. "REST API" matches "REST", but not "Java" vs "JavaScript")
  if (normA.length > 3 && normB.length > 3) {
    if (normA.includes(normB) || normB.includes(normA)) {
      // guard Java vs JavaScript
      if ((normA === 'java' && normB.startsWith('javascript')) || (normB === 'java' && normA.startsWith('javascript'))) {
        return false;
      }
      return true;
    }
  }
  return false;
}
