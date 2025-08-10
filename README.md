# TaskMaster

TaskMaster is a modern web application designed for volunteer organizations to streamline membership management, event coordination, and task organization. Built with Next.js and TypeScript, it provides a responsive interface that works seamlessly on both desktop and mobile devices with an elegant dark theme.

## What TaskMaster Does

TaskMaster helps volunteer organizations manage their core activities through an integrated platform that handles:

- **Member Management**: Registration, approval, renewals, and profile management
- **Event Organization**: Calendar-based event planning with ticketing and participant management
- **Task Coordination**: Both event-specific tasks and general organizational tasks via Kanban boards
- **Payment Processing**: Automated membership renewals and event ticket purchases via Swish
- **Communication**: Automated email notifications and reminders

## Key Features

### Member Registry
- **Membership Applications**: Users can apply for membership through the web interface
- **Admin Approval**: Admins review and approve membership applications
- **Automatic Notifications**: Email confirmations and reminders are sent automatically
- **Profile Management**: Members can update their personal information and view membership status
- **Membership Renewals**: Simple one-click renewal process with payment integration

### Event Management
- **Interactive Calendar**: Visual calendar interface showing all organization events
- **Event Creation**: Host-driven event creation with participant management
- **Ticketing System**: Integrated ticket purchasing and participant/reserve list management
- **Task Coordination**: Event-specific task management with phases (preparation, execution, aftermath)

### Task Management
- **Event Tasks**: Organized by event phases with assignees, due dates, and automatic reminders
- **Kanban Board**: General organizational tasks with drag-and-drop workflow management
- **PDF Export**: Generate printable task schedules and participant lists

### Administrative Tools
- **Member Dashboard**: Comprehensive view of all members with sorting and filtering
- **User Management**: Admin tools for creating, updating, and managing user accounts
- **Payment Integration**: Swish payment processing for memberships and event tickets
- **Automated Processes**: Scheduled tasks for membership reminders and data cleanup

## Technology Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **UI Framework**: Material-UI (MUI) with responsive design
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT-based authentication system
- **Payments**: Swish integration for Swedish payment processing
- **Email**: React Email with template support
- **PDF Generation**: React-PDF for document export
- **Testing**: Vitest with React Testing Library

## Getting Started

### For Users
1. Navigate to the application URL provided by your organization
2. Click "Apply for Membership" to create an account
3. Wait for admin approval and follow the email instructions
4. Log in to access your profile, events, and organizational tools

### For Administrators
- Use the Members page to review and approve membership applications
- Create and manage events through the Calendar interface
- Assign tasks and monitor progress through the task management system
- Configure organization settings and email templates

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/download) (v18 or higher)
- [Git](https://git-scm.com/downloads)
- A PostgreSQL database
- [Visual Studio Code](https://visualstudio.microsoft.com/downloads/) (recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KellenSmith/TaskMaster.git
   cd TaskMaster
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the required environment variables (contact the project maintainer for the specific values needed).

4. **Set up the database:**
   ```bash
   npm run prisma-push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [https://localhost:3000](https://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (pages)/         # Application pages
│   ├── api/             # API routes
│   ├── context/         # React contexts
│   ├── lib/             # Utility functions and actions
│   ├── prisma/          # Database schema and client
│   └── ui/              # Reusable UI components
└── public/              # Static assets
```

## Contributing

1. **Get Access**: Contact the project maintainer to be added to the repository
2. **Pick an Issue**: Browse the GitHub issues and select one that matches your interests
3. **Create a Branch**: Create a feature branch for your work
4. **Make Changes**: Implement your changes following the existing code style
5. **Test**: Run tests and ensure your changes don't break existing functionality
6. **Submit PR**: Create a pull request with a clear description of your changes

## Future Plans

The following features are planned for future development:

### Enhanced Member Management
- Member blacklist functionality to prevent application overload
- Advanced membership analytics with visual graphs
- Bulk member operations and data export

### Advanced Calendar Integration
- Synchronization with Facebook pages and social media
- External calendar integration (Google Calendar, Outlook)
- Calendar import/export functionality

### Extended Configuration Options
- Admin configuration page for membership periods
- Customizable email templates
- UI text translations and multi-language support
- Default event task templates

### Information Management
- Document library integration
- Knowledge base with searchable content
- File sharing and version control

### Workflow Enhancements
- Automated newsletter system with Sendgrid integration
- Advanced task assignment and delegation
- Calendar export for volunteer shifts
- Enhanced reporting and analytics

### Payment System Expansion
- Multiple payment provider support
- Refund automation for event tickets
- Financial reporting and tracking

These features represent the long-term vision for TaskMaster and will be implemented based on community needs and development priorities.
