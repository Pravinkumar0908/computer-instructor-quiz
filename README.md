# Govt Exam Quiz (Next.js + Tailwind)

Simple MCQ quiz app with time-bound test, question navigator, and result summary.

## Run Locally

```bash
npm install
npm run dev
```

Open the app at localhost:3000.

## Update Questions (JSON)

Edit the file: src/data/questions.json

### JSON Format

- title: string
- description: string
- timeLimitSeconds: number
- questions: array of objects with:
	- id: string
	- question: string
	- options: string[]
	- answerIndex: number (0-based)
	- explanation: string (optional)

Replace the sample data with your own government exam questions.
