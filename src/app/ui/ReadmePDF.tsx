import { Document, Page, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 11,
        lineHeight: 1.5,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    subheading: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    paragraph: {
        marginBottom: 10,
        textAlign: 'justify',
    },
    bulletPoint: {
        marginLeft: 15,
        marginBottom: 5,
    },
    code: {
        fontFamily: 'Courier',
        backgroundColor: '#f5f5f5',
        padding: 5,
        marginVertical: 5,
    },
    link: {
        color: '#0066cc',
    },
});

const ReadmePDF = () => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>TaskMaster</Text>
                
                <Text style={styles.paragraph}>
                    TaskMaster is a modern web application designed for volunteer organizations to streamline 
                    membership management, event coordination, and task organization. Built with Next.js and 
                    TypeScript, it provides a responsive interface that works seamlessly on both desktop and 
                    mobile devices with an elegant dark theme.
                </Text>

                <Text style={styles.heading}>What TaskMaster Does</Text>
                <Text style={styles.paragraph}>
                    TaskMaster helps volunteer organizations manage their core activities through an integrated platform that handles:
                </Text>
                <Text style={styles.bulletPoint}>• Member Management: Registration, approval, renewals, and profile management</Text>
                <Text style={styles.bulletPoint}>• Event Organization: Calendar-based event planning with ticketing and participant management</Text>
                <Text style={styles.bulletPoint}>• Task Coordination: Both event-specific tasks and general organizational tasks via Kanban boards</Text>
                <Text style={styles.bulletPoint}>• Payment Processing: Automated membership renewals and event ticket purchases via Swish</Text>
                <Text style={styles.bulletPoint}>• Communication: Automated email notifications and reminders</Text>

                <Text style={styles.heading}>Key Features</Text>

                <Text style={styles.subheading}>Member Registry</Text>
                <Text style={styles.bulletPoint}>• Membership Applications: Users can apply for membership through the web interface</Text>
                <Text style={styles.bulletPoint}>• Admin Approval: Admins review and approve membership applications</Text>
                <Text style={styles.bulletPoint}>• Automatic Notifications: Email confirmations and reminders are sent automatically</Text>
                <Text style={styles.bulletPoint}>• Profile Management: Members can update their personal information and view membership status</Text>
                <Text style={styles.bulletPoint}>• Membership Renewals: Simple one-click renewal process with payment integration</Text>

                <Text style={styles.subheading}>Event Management</Text>
                <Text style={styles.bulletPoint}>• Interactive Calendar: Visual calendar interface showing all organization events</Text>
                <Text style={styles.bulletPoint}>• Event Creation: Host-driven event creation with participant management</Text>
                <Text style={styles.bulletPoint}>• Ticketing System: Integrated ticket purchasing and participant/reserve list management</Text>
                <Text style={styles.bulletPoint}>• Task Coordination: Event-specific task management with phases (preparation, execution, aftermath)</Text>

                <Text style={styles.subheading}>Task Management</Text>
                <Text style={styles.bulletPoint}>• Event Tasks: Organized by event phases with assignees, due dates, and automatic reminders</Text>
                <Text style={styles.bulletPoint}>• Kanban Board: General organizational tasks with drag-and-drop workflow management</Text>
                <Text style={styles.bulletPoint}>• PDF Export: Generate printable task schedules and participant lists</Text>

                <Text style={styles.subheading}>Administrative Tools</Text>
                <Text style={styles.bulletPoint}>• Member Dashboard: Comprehensive view of all members with sorting and filtering</Text>
                <Text style={styles.bulletPoint}>• User Management: Admin tools for creating, updating, and managing user accounts</Text>
                <Text style={styles.bulletPoint}>• Payment Integration: Swish payment processing for memberships and event tickets</Text>
                <Text style={styles.bulletPoint}>• Automated Processes: Scheduled tasks for membership reminders and data cleanup</Text>

            </Page>
            <Page size="A4" style={styles.page}>
                <Text style={styles.heading}>Technology Stack</Text>
                <Text style={styles.bulletPoint}>• Frontend: Next.js 15 with React 19 and TypeScript</Text>
                <Text style={styles.bulletPoint}>• UI Framework: Material-UI (MUI) with responsive design</Text>
                <Text style={styles.bulletPoint}>• Database: PostgreSQL with Prisma ORM</Text>
                <Text style={styles.bulletPoint}>• Authentication: Custom JWT-based authentication system</Text>
                <Text style={styles.bulletPoint}>• Payments: Swish integration for Swedish payment processing</Text>
                <Text style={styles.bulletPoint}>• Email: React Email with template support</Text>
                <Text style={styles.bulletPoint}>• PDF Generation: React-PDF for document export</Text>
                <Text style={styles.bulletPoint}>• Testing: Vitest with React Testing Library</Text>

                <Text style={styles.heading}>Getting Started</Text>

                <Text style={styles.subheading}>For Users</Text>
                <Text style={styles.bulletPoint}>1. Navigate to the application URL provided by your organization</Text>
                <Text style={styles.bulletPoint}>2. Click &quot;Apply for Membership&quot; to create an account</Text>
                <Text style={styles.bulletPoint}>3. Wait for admin approval and follow the email instructions</Text>
                <Text style={styles.bulletPoint}>4. Log in to access your profile, events, and organizational tools</Text>

                <Text style={styles.subheading}>For Administrators</Text>
                <Text style={styles.bulletPoint}>• Use the Members page to review and approve membership applications</Text>
                <Text style={styles.bulletPoint}>• Create and manage events through the Calendar interface</Text>
                <Text style={styles.bulletPoint}>• Assign tasks and monitor progress through the task management system</Text>
                <Text style={styles.bulletPoint}>• Configure organization settings and email templates</Text>

                <Text style={styles.heading}>Development Setup</Text>

                <Text style={styles.subheading}>Prerequisites</Text>
                <Text style={styles.bulletPoint}>• Node.js (v18 or higher)</Text>
                <Text style={styles.bulletPoint}>• Git</Text>
                <Text style={styles.bulletPoint}>• A PostgreSQL database</Text>
                <Text style={styles.bulletPoint}>• Visual Studio Code (recommended)</Text>

                <Text style={styles.subheading}>Installation</Text>
                <Text style={styles.paragraph}>1. Clone the repository:</Text>
                <Text style={styles.code}>
                    git clone https://github.com/KellenSmith/TaskMaster.git{'\n'}
                    cd TaskMaster
                </Text>

                <Text style={styles.paragraph}>2. Install dependencies:</Text>
                <Text style={styles.code}>npm install</Text>

                <Text style={styles.paragraph}>3. Set up environment variables:</Text>
                <Text style={styles.paragraph}>
                    Create a .env file in the root directory with the required environment variables.
                </Text>

                <Text style={styles.paragraph}>4. Set up the database:</Text>
                <Text style={styles.code}>npm run prisma-push</Text>

                <Text style={styles.paragraph}>5. Start the development server:</Text>
                <Text style={styles.code}>npm run dev</Text>

                <Text style={styles.paragraph}>6. Open your browser and navigate to https://localhost:3000</Text>

            </Page>
            <Page size="A4" style={styles.page}>
                <Text style={styles.heading}>Available Scripts</Text>
                <Text style={styles.bulletPoint}>• npm run dev - Start development server with Turbopack</Text>
                <Text style={styles.bulletPoint}>• npm run build - Build the application for production</Text>
                <Text style={styles.bulletPoint}>• npm run start - Start the production server</Text>
                <Text style={styles.bulletPoint}>• npm run lint - Run ESLint</Text>
                <Text style={styles.bulletPoint}>• npm run test - Run tests with Vitest</Text>
                <Text style={styles.bulletPoint}>• npm run format - Format code with Prettier</Text>

                <Text style={styles.heading}>Contributing</Text>
                <Text style={styles.bulletPoint}>1. Get Access: Contact the project maintainer to be added to the repository</Text>
                <Text style={styles.bulletPoint}>2. Pick an Issue: Browse the GitHub issues and select one that matches your interests</Text>
                <Text style={styles.bulletPoint}>3. Create a Branch: Create a feature branch for your work</Text>
                <Text style={styles.bulletPoint}>4. Make Changes: Implement your changes following the existing code style</Text>
                <Text style={styles.bulletPoint}>5. Test: Run tests and ensure your changes don&apos;t break existing functionality</Text>
                <Text style={styles.bulletPoint}>6. Submit PR: Create a pull request with a clear description of your changes</Text>

                <Text style={styles.heading}>Future Plans</Text>
                <Text style={styles.paragraph}>
                    The following features are planned for future development:
                </Text>

                <Text style={styles.subheading}>Enhanced Member Management</Text>
                <Text style={styles.bulletPoint}>• Member blacklist functionality to prevent application overload</Text>
                <Text style={styles.bulletPoint}>• Advanced membership analytics with visual graphs</Text>
                <Text style={styles.bulletPoint}>• Bulk member operations and data export</Text>

                <Text style={styles.subheading}>Advanced Calendar Integration</Text>
                <Text style={styles.bulletPoint}>• Synchronization with Facebook pages and social media</Text>
                <Text style={styles.bulletPoint}>• External calendar integration (Google Calendar, Outlook)</Text>
                <Text style={styles.bulletPoint}>• Calendar import/export functionality</Text>

                <Text style={styles.subheading}>Extended Configuration Options</Text>
                <Text style={styles.bulletPoint}>• Admin configuration page for membership periods</Text>
                <Text style={styles.bulletPoint}>• Customizable email templates</Text>
                <Text style={styles.bulletPoint}>• UI text translations and multi-language support</Text>
                <Text style={styles.bulletPoint}>• Default event task templates</Text>

                <Text style={styles.subheading}>Information Management</Text>
                <Text style={styles.bulletPoint}>• Document library integration</Text>
                <Text style={styles.bulletPoint}>• Knowledge base with searchable content</Text>
                <Text style={styles.bulletPoint}>• File sharing and version control</Text>

                <Text style={styles.subheading}>Workflow Enhancements</Text>
                <Text style={styles.bulletPoint}>• Automated newsletter system with Sendgrid integration</Text>
                <Text style={styles.bulletPoint}>• Advanced task assignment and delegation</Text>
                <Text style={styles.bulletPoint}>• Calendar export for volunteer shifts</Text>
                <Text style={styles.bulletPoint}>• Enhanced reporting and analytics</Text>

                <Text style={styles.paragraph}>
                    These features represent the long-term vision for TaskMaster and will be implemented 
                    based on community needs and development priorities.
                </Text>
            </Page>
        </Document>
    );
};

export default ReadmePDF;