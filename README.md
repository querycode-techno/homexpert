# HomeXpert - Home Services Management Platform

HomeXpert is a comprehensive platform designed to streamline the management of home services, connecting customers with vendors, and providing robust admin capabilities for managing leads, employees, subscriptions, bookings, and more.

## Key Features

*   **Admin Panel:** Centralized dashboard for overall platform management.
*   **Lead Management:** Advanced tools for generating, tracking, assigning, and performing bulk operations on leads. Includes features for vendor-specific lead quotas and detailed lead change tracking.
*   **Vendor Management:** Onboarding, lead quotas, performance tracking, and a planned dedicated vendor portal.
*   **Employee Management:** Managing internal staff, roles, and permissions.
*   **Subscription Management:** Handling vendor subscription plans and tracking.
*   **Booking Management:** Tracking and managing service bookings.
*   **Role-Based Access Control:** Defining permissions for different user types (Admin, Subadmin, Vendor).
*   **Notifications & Support:** System for alerts and user support.
*   **Payment Overview:** Tracking financial transactions.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** JavaScript (using JSX for components). (Note: Some components may be transitioning to or utilizing TypeScript (`.tsx`) for enhanced type safety and development experience.)
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Component Library:** shadcn/ui (leveraging Radix UI primitives and styled with Tailwind CSS)
*   **Icons:** Lucide React
*   **State Management:** React Context API, React Hooks (`useState`, `useEffect`, `useReducer`, etc.)
*   **API & Data Handling:** Next.js Server Actions, Fetch API for client-side requests.

## Planned Integrations & Future Features

*   **Database:** MongoDB
*   **Payment Gateway:** PhonePe Integration
*   **Storage:** Firebase Storage
*   **Authentication:** Firebase Authentication
*   **Import/Export Functionality:** For various data types (leads, bookings, etc.).
*   **Subadmin Interfaces:** Dedicated views and controls for sub-administrators.
*   **Vendor Portal:** A dedicated interface for vendors to manage their profiles, leads, and subscriptions.
*   **Lead Statistics Visualization:** Graphical representation of lead data and trends.
*   **Enhanced Employee Management:** Further refinements and features.
*   **Comprehensive Testing:** For adding and removing multiple leads, vendor subscription tracking.
*   **Lead Return Functionality:** Allowing vendors to return leads under specific conditions.
*   **Vendor Performance Dashboard:** Visual insights into vendor activity and success rates.

## Running the Project (v0 Context)

This project is developed and previewed within the v0 AI environment.
*   **Preview:** Code changes are rendered live in the v0 interface.
*   **Installation:** To use the generated code, you can download it. For shadcn/ui components, you might use `npx shadcn@latest add [component-name]` in your local Next.js project, then integrate the provided component logic.
*   **Environment Variables:** In the v0 environment, environment variables are managed via Vercel integrations or the "AddEnvironmentVariables" feature when prompted. `.env` files are not used by the v0 preview.

## Local Development (If setting up as a standard Next.js Project)

If you download the code to run as a standard Next.js project:

1.  **Prerequisites:**
    *   Node.js (v18 or later recommended)
    *   npm, yarn, or pnpm
2.  **Setup:**
    *   Clone or download the project files.
    *   Navigate to the project directory.
3.  **Install Dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    \`\`\`
4.  **Environment Variables:**
    *   Create a `.env.local` file in the root directory.
    *   Add necessary environment variables (e.g., database connection strings, API keys for Firebase, PhonePe). See the example `.env.local` structure provided separately.
    *   **Important:** Ensure `.env.local` is added to your `.gitignore` file to prevent committing sensitive credentials.
5.  **Run Development Server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    \`\`\`
    The application will typically be available at `http://localhost:3000`.

## Project Structure (Illustrative)

\`\`\`
/app
  /admin
    /leads             # Lead management page and components
    /employees         # Employee management
    /subscriptions     # Subscription management
    /bookings          # Booking management
    # ... other admin sections
    layout.jsx         # Admin layout
    page.jsx           # Admin dashboard entry
  /login
    /admin
    /vendor
  layout.jsx           # Root layout
  page.jsx             # Landing page
/components
  /admin
    lead-management.jsx
    employee-management.jsx
    # ... other admin-specific UI components
  /ui                  # shadcn/ui components (typically managed by shadcn CLI)
  # ... shared components (header, footer, etc.)
/lib                   # Utility functions, context, etc.
  data-context.jsx
  utils.ts
/public                # Static assets (images, fonts)
/hooks                 # Custom React hooks
tailwind.config.js     # Tailwind CSS configuration
next.config.mjs        # Next.js configuration
# README.md            # This file
# package.json
# tsconfig.json        # If using TypeScript
# homexpert
# homexpert
# homexpert
