# OssRyu - BJJ Training & Progress Tracking

OssRyu is a comprehensive Brazilian Jiu-Jitsu (BJJ) training and tracking application that empowers martial artists to optimize their learning journey through advanced social and tracking features.

![OssRyu](./generated-icon.png)

## Features

- **Technique Library**: Access a vast collection of BJJ techniques with detailed descriptions and video tutorials
- **Training Tracker**: Log and monitor your training sessions, including:
  - Duration and intensity
  - Techniques practiced
  - Rolling partners
  - Personal notes and reflections
- **Progress Dashboard**: Visualize your BJJ journey with:
  - Training frequency metrics
  - Technique mastery progress
  - Belt promotion tracking
  - Achievement system
- **Community Features**:
  - Connect with training partners
  - Share progress updates
  - Exchange training tips
  - Find training partners
- **Technique Passport**: Track your progress across different techniques and positions
- **Smart Training Recommendations**: Get personalized training suggestions based on your level and goals

## Tech Stack

- **Frontend**: React (Next.js) with TypeScript
- **UI Components**: Tailwind CSS + shadcn/ui
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **API Integration**: YouTube API, OpenAI API

## Getting Started

### Prerequisites

- Node.js 20.x or later
- PostgreSQL database
- API keys for external services (OpenAI, etc.)

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
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Contributing

We welcome contributions to OssRyu! If you'd like to contribute:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the BJJ community for inspiration and feedback
- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

## Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/yourusername/OssRyu/issues) page
2. Open a new issue if needed
3. Join our community discussions

---

Built with ❤️ for the BJJ community