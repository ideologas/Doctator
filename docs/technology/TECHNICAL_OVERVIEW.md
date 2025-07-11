# Technical Overview: Carrot Invoice Management System

This document provides a high-level technical overview of the Carrot application. It is intended for developers, QA engineers, and operations teams to understand the system's architecture, key components, and core technologies.

---

## 1. High-Level System Architecture

The Carrot application is a **full-stack web application built on Next.js, with Supabase serving as the core Backend-as-a-Service (BaaS)**. This architecture consolidates the frontend and backend into a single, deployable Next.js project, while offloading database, authentication, and file storage responsibilities to the managed Supabase platform.

The architectural pattern is best described as a **serverless monolith**, leveraging Next.js API Routes for backend logic and React Server Components for efficient data fetching and rendering.

### Conceptual Flow:

Verbally, the system operates as follows:
1.  **Frontend (UI):** A user interacts with the UI built using Next.js, React, and Shadcn/ui. The frontend is responsible for presenting data and capturing user input. It uses TanStack Query for managing server state.
2.  **Backend (Next.js API Routes):** All business logic is encapsulated within API routes (e.g., `/api/invoices`, `/api/suppliers`). These serverless functions handle requests, interact with Supabase services, and may call external AIs.
3.  **Backend-as-a-Service (Supabase):** Supabase acts as the system's "center of gravity," providing:
    *   **PostgreSQL Database:** The primary data store for all structured data (invoices, suppliers, users, etc.).
    *   **Authentication:** Manages user login, sessions, and security, integrated via Next.js middleware.
    *   **Storage (S3):** Stores unstructured files like invoice PDFs and transaction reports in designated buckets (e.g., `invoices-for-processing`, `invoices`, `transactions`).
4.  **External Integrations:**
    *   **AI Services (OpenAI/Gemini):** Used for intelligent document parsing (invoices) and to power the conversational AI chat interface.
    *   **Bank of Lithuania:** A daily cron job fetches currency exchange rates to support multi-currency operations.

 *(Note: A visual block diagram would show the Next.js App interacting with Supabase (Auth, DB, Storage) and external APIs like OpenAI and a currency service.)*

---

## 2. Key Technical Components & Their Roles

The system is organized into several key functional modules:

*   **Invoice Management Module:**
    *   **Purpose:** Manages the entire lifecycle of an invoice, from creation and AI-driven parsing to workflow-based processing and payment tracking.
    *   **Key Entities:** `Invoice` DB table, `/api/invoices/*` API routes, `InvoiceKanbanBoard.tsx`, `InvoiceForm.tsx`.

*   **Supplier & Payment Management Modules:**
    *   **Purpose:** Provide CRUD functionality for managing supplier information and recording payments against invoices.
    *   **Key Entities:** `Supplier` & `Payment` DB tables, `/api/suppliers/*` and `/api/payments/*` API routes.

*   **AI-Powered Chat & Workflow Engine:**
    *   **Purpose:** A conversational interface that allows users to query data and execute actions using natural language. The engine interprets requests and can trigger SQL queries, API calls, or multi-step workflow plans.
    *   **Key Entities:** `/api/chat/*` routes, `prompt-instructions` directory (contains AI logic).

*   **Asynchronous Batch Processing & Reconciliation Engine:**
    *   **Purpose:** Handles long-running, background tasks for processing large volumes of data without blocking the UI.
    *   **Invoice Batch Processing (`/api/batch/start`):** Scans a dedicated S3 bucket (`invoices-for-processing`), uses AI to parse each file, and creates corresponding `Invoice` records.
    *   **Transaction Reconciliation (`/api/transaction-jobs`):** Scans an S3 bucket (`transactions`) for XLSX files, parses them, and matches transaction records against existing invoices using a custom rules engine (`json-rules-engine`) and reconciliation logic (`reconciliation-engine.ts`).
    *   **Key Entities:** `BatchJob` DB table to track job status.

*   **Authentication & Authorization Module:**
    *   **Purpose:** Secures the application by managing user access.
    *   **Key Entities:** `middleware.ts`, Supabase Auth integration. The middleware intercepts all requests to verify a user's session. Authorization is designed to be enforced at the database level using Supabase's Row-Level Security (RLS).

---

## 3. Core Technologies & Rationale

*   **Language:** **TypeScript** for robust type safety and maintainability.
*   **Framework:** **Next.js** (with App Router) for its hybrid server/client component model, file-based routing, and integrated API capabilities, creating a cohesive full-stack application.
*   **Backend-as-a-Service (BaaS):** **Supabase** is the cornerstone of the backend, chosen to accelerate development by providing a managed PostgreSQL database, authentication, file storage, and Row-Level Security out of the box.
*   **Database & ORM:** **PostgreSQL** (via Supabase) for reliable relational data storage. **Prisma** is used as the ORM for type-safe database queries and schema management.
*   **UI & Styling:**
    *   **React:** The foundational UI library.
    *   **Shadcn/ui & Radix UI:** For a highly accessible and composable component library.
    *   **Tailwind CSS:** For efficient, utility-first styling.
*   **Client-Side State Management:** **TanStack Query** to manage server state, handling caching, refetching, and background updates of data from the API.
*   **AI Integration:** **OpenAI (GPT-4o)** and **Google Gemini** are used for advanced document parsing and conversational AI, with the flexibility for users to choose their preferred provider.
*   **File Processing:**
    *   **`pdf-lib`:** For server-side PDF manipulation (e.g., splitting long documents for optimized AI parsing).
    *   **`exceljs`:** For parsing XLSX transaction files in the reconciliation job.

---

## 4. Data Flow & Persistence Overview

Data primarily flows from external documents (invoices, transaction logs) into the system's structured database via automated jobs.

1.  **Invoice Ingestion:** Invoice PDFs are uploaded to a staging bucket in **Supabase Storage**. A batch job (`/api/batch/start`) processes these files, uses AI to parse their content, and persists the structured data into the **PostgreSQL `Invoice` table**. The original PDF is then moved to an archive bucket.
2.  **Transaction Ingestion:** Transaction spreadsheets (XLSX) are uploaded to another staging bucket. A reconciliation job (`/api/transaction-jobs`) parses these files and stores the data in the **PostgreSQL `Transaction` table**, linking each transaction to its corresponding invoice.
3.  **User Data Access:** The React frontend requests data from Next.js API routes. These routes query the PostgreSQL database via Prisma and return the data to the client for rendering.

**Primary Data Stores:**
*   **Supabase PostgreSQL:** The single source of truth for all structured business data, including `Supplier`, `Invoice`, `Payment`, `Transaction`, `User`, `BatchJob`, and `InvoiceStatusHistory` tables.
*   **Supabase Storage (S3):** Serves as the object store for all unstructured data, primarily invoice PDFs and transaction files, organized into staging and archive buckets.

---

## 5. Deployment & Environment Considerations

The application is designed for a **serverless, cloud-native deployment on Vercel**.

*   **Environment:** Vercel provides the hosting for the Next.js application, automatically deploying API routes as serverless functions.
*   **Continuous Deployment:** The project is configured for CI/CD from a GitHub repository. Every push to the main branch can trigger a new production deployment.
*   **Cron Jobs:** Scheduled tasks, such as the daily currency rate update, are configured using Vercel's cron job functionality (`vercel.json`).
*   **Infrastructure:** The core infrastructure is managed by Vercel (for compute) and Supabase (for data, auth, and storage), minimizing operational overhead.

---

## 6. Key Technical Decisions/Constraints

*   **Supabase as the Backend Core:** The decision to heavily rely on Supabase was fundamental. It provides immense development speed by bundling essential backend services, but also creates a dependency on the Supabase platform.
*   **AI-First Data Entry:** The system is built around the premise of using AI to automate data entry from invoices. This architectural choice necessitates robust prompting (`invoice-parsing-prompt.ts`) and handling of potential AI inconsistencies.
*   **Asynchronous Processing for Scalability:** For handling potentially large volumes of files, the system uses a database-backed job queue (`BatchJob` table). This asynchronous approach ensures that the API remains responsive while long-running tasks execute in the background.
*   **Monolithic Full-Stack Approach:** By using Next.js for both frontend and backend, the team opted for a simplified, single-codebase architecture over a more complex microservices setup. This is efficient for smaller teams but may require refactoring as the system scales.
*   **Type Safety as a Priority:** The strict use of TypeScript, Prisma, and Zod (as per coding guidelines) was a key decision to enhance code quality, reduce bugs, and improve developer experience.
