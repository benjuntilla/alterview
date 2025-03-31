# Alterview - AI-Powered Student Interviews

Alterview is an application designed to revolutionize student interviews using AI. This project provides a structured navigation system for both students and teachers.

## Project Structure

The application follows a clear routing structure:

### Home Page (/)
- Landing page with options for Student and Teacher login

### Student Flow
1. **Student Login** (`/student-login`)
   - Simple login form for students
2. **Student Dashboard** (`/students/:student_id`)
   - Displays assessments available to the student
3. **Student Interview** (`/assessment/:student_id/:assessment_id`)
   - The actual interview page where students interact with the AI

### Teacher Flow
1. **Teacher Login** (`/teacher-login`)
   - Simple login form for teachers
2. **Teacher Dashboard** (`/teacher/:teacher_id`)
   - Displays assessments created by the teacher
3. **Create Assessment** (`/teacher/:teacher_id/create-assessment`)
   - Page for creating new assessments
4. **Assessment Review** (`/teacher/:teacher_id/assessment/:assessment_id`)
   - Detailed view of a specific assessment with student results

## Getting Started

First, set up your environment variables:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and update with your actual API credentials:
```
NEXT_PUBLIC_API_BASE_URL=http://your-api-url.com/api/v1
NEXT_PUBLIC_API_KEY=your_actual_api_key
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Technologies Used

- Next.js 14 with App Router
- React
- TypeScript
- Tailwind CSS
- Vapi AI for voice interactions

## Development Notes

- The current implementation includes placeholder pages with minimal UI
- Data flow and business logic will be implemented in future iterations
- The interview functionality is located at `/assessment/:student_id/:assessment_id`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

This project is configured for easy deployment on Vercel. All configuration values are hardcoded for hackathon purposes.

1. Create a Vercel account at [vercel.com](https://vercel.com) if you don't have one already.

2. Deploy using one of these methods:

   **Option 1: Using Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

   **Option 2: Using GitHub Integration**
   1. Push your code to a GitHub repository
   2. Import the project in the Vercel dashboard
   3. Deploy

3. Your app will be deployed to a URL like `your-project.vercel.app`

For more customization options, refer to the [Vercel documentation](https://vercel.com/docs).

## PDF Extraction Setup

This application uses PDF.js for PDF text extraction in the assessment creation flow. We use local PDF.js files stored in the public directory for reliability and performance:

### Required Files in public/js/pdf/

- `pdf.mjs` - Main PDF.js library
- `pdf.worker.mjs` - PDF.js worker script 
- `cmaps/` - Character maps for international text support

```javascript
// Configure PDF.js to use local worker file
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf/pdf.worker.mjs';
}

// PDF.js document configuration
{
  nativeImageDecoderSupport: 'display',
  ignoreErrors: true,
  cMapUrl: '/js/pdf/cmaps/',
  cMapPacked: true
}
```

This local file approach ensures the application works reliably without external dependencies or CORS issues. It also provides better performance and works offline once the application is loaded.
