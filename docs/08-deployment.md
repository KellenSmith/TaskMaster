## TaskMaster Deployment Guide

### Prerequisites

1. **Vercel Account**
   - Create a Vercel account using your email address.
   - Log in to the Vercel dashboard.
2. **GitHub Integration**
   - In [Vercel account settings>Authentication](https://vercel.com/account/settings/authentication), connect your GitHub account.
3. **Vercel Access Token**
   - Generate a new [Vercel access token](https://vercel.com/account/settings/tokens) (set to never expire).
   - Store the token securely.
4. **Customer Configuration**
   - Edit `scripts/customer-vars.json` using `scripts/customer-vars.example.json` as a template.
   - Include the Vercel access token and all required customer settings.

---

### Automated Deployment: `setup-new-customer.sh`

This script provisions a new customer project on Vercel and connects it to the TaskMaster GitHub repository. It automates environment setup, resource provisioning, and triggers deployments.

#### Main Steps Performed by the Script

1. **Preparation**
   - Removes any existing `.vercel` directory to avoid conflicts.
   - Loads customer variables from `customer-vars.json`.
   - Authenticates to Vercel using the access token.
   - Sanitizes and generates a project name based on the organization.

2. **Project & GitHub Setup**
   - Creates a new Vercel project for the customer.
   - Links the project to the local directory and GitHub repository.
   - Connects the project to the TaskMaster GitHub repo (handles already-connected cases).

3. **Resource Provisioning**
   - Provisions Prisma Postgres databases for production, preview, and development environments.
   - Sets up Vercel Blob Stores for backups, production, and preview/development.
   - Handles access levels and environment-specific tokens.

4. **Environment Variables**
   - Generates secrets (auth, cron) for each environment.
   - Adds customer-specific variables (email, SMTP, Swedbank Pay, SEO, etc.) to all relevant environments.
   - Ensures sensitive values are marked as such.

5. **Deployment**
   - Pulls environment variables to `.env.local`.
   - Deploys the preview branch (`dev`) to Vercel preview environment.
   - Deploys the master branch to Vercel production environment.

---

### Example Workflow

1. Configure `customer-vars.json` with all required values.
2. Run:
   ```bash
   bash scripts/setup-new-customer.sh
   ```
3. Respond to prompts for marketplace and privacy policy acceptance.
4. Wait for script to finish. Both production and preview deployments will be triggered automatically.

---

### Notes

- The script is robust against errors and handles multiline environment variable values.
- All environment variables are provisioned for production, preview, and development as needed.
- Storage and database resources are provisioned only if not already present.
- Deployments are triggered for both preview (`dev` branch) and production (`master` branch) after setup.

---

For troubleshooting or advanced usage, see the script comments and logs generated during execution.
