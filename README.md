# OssRyu - BJJ Training & Progress Tracking

OssRyu is a comprehensive Brazilian Jiu-Jitsu (BJJ) training and tracking application that empowers martial artists to optimize their learning journey through advanced social and tracking features.

## Features

### Training Management
- **Training Log System**: Track detailed training sessions including:
  - Duration and intensity metrics
  - Techniques practiced with categorization
  - Performance self-assessment
  - Energy level tracking
  - Notes and coach feedback
- **Progress Dashboard**: 
  - Visual training metrics and charts
  - Training type distribution analysis
  - Success rate tracking for submissions and escapes
  - Focus area progression

### Technique Library & Learning
- **Comprehensive Technique Database**:
  - Categorized techniques (Submissions, Positions, Escapes, Takedowns)
  - Detailed descriptions and usage contexts
  - Progress tracking per technique
- **Training Wizard**: AI-powered training recommendations based on your level and goals

### Social Features
- **Community Integration**:
  - Connect with training partners
  - Share progress updates
  - Exchange training tips
- **Achievement System**: Track and showcase your BJJ milestones

### Mobile-First Design
- Responsive interface optimized for mobile devices
- Quick access via hamburger menu navigation
- Touch-friendly components and interactions
- Smooth transitions and intuitive layout

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight routing
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: 
  - Tailwind CSS for styling
  - shadcn/ui for component library
  - Recharts for data visualization
  - Lucide React for icons

### Backend
- **Server**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase
- **API Integration**: OpenAI for training recommendations

### Development
- **Deployment**: Replit
- **Version Control**: GitHub
- **Type Safety**: TypeScript with Zod schemas
- **Package Management**: npm

## Getting Started

### Prerequisites
- Node.js 20.x or later
- PostgreSQL database
- Supabase account for authentication
- OpenAI API key for training recommendations

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OssRyu.git
cd OssRyu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```env
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5000`.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Submit a pull request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions:
1. Check existing [Issues](https://github.com/yourusername/OssRyu/issues)
2. Open a new issue if needed
3. Join our community discussions

---

Built with ❤️ for the BJJ community