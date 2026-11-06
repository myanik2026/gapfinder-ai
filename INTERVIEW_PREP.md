# GapFinder AI: Interview Prep

Use these notes to explain the project in your own words. Be transparent about
what is a prototype and what would need more work before a real school rollout.

## A 60-second project introduction

> GapFinder AI is a study coach that helps a student find gaps they may not
> know to ask about. A student uploads a syllabus, notes, or past papers. The
> app builds a simple topic map, retrieves relevant passages from those
> materials, and uses Groq through the Vercel AI SDK to create a cited
> diagnostic quiz. It checks answers, explains mistakes with the supporting
> passage, groups performance into weak, medium, and strong topics, and
> prioritizes a revision plan around the student's available study time. The
> demo saves progress in the browser. I chose a lightweight lexical retriever
> rather than a vector database to keep the assignment easy to run and explain.
> I would next improve retrieval evaluation, authentication, and persistent
> storage before a real deployment to students.

## Explain the user journey

1. Continue as the demo student, or upload PDF, TXT, or Markdown material.
2. Choose a topic and request a diagnostic. In AI mode, the server retrieves
   passages before asking Groq to generate five questions.
3. Answer the questions. Each has a citation to a retrieved source excerpt.
4. Submit to see accuracy, topic-level weaknesses, and the explanation for
   each answer.
5. Review the plan. The weakest and past-paper-relevant topics get priority;
   the plan changes after another diagnostic.
6. Optionally ask the study coach a question. It retrieves passages for that
   question and returns a cited explanation.

## Likely technical interview questions

### Product and design

**1. What problem does the app solve?**  
Most study tools answer questions students already know to ask. GapFinder
starts with a diagnostic so it can point out topics the student may have
overlooked, then tells them what to study next.

**2. Why is the gap report more important than the chatbot?**  
The assignment explicitly asks for a diagnosis, not just answers. Chat can
explain a topic, but the diagnostic, topic-level report, and adaptive plan
create the core learning loop.

**3. Who are the users?**  
The first user is a student preparing for an exam. Teachers and class analytics
are possible future users, but this prototype does not implement teacher
accounts or class-level data.

**4. How would you measure whether the product helps?**  
Track change in topic-level quiz accuracy over repeated attempts, completion
rate, time spent on weak topics, and whether students return to retest. For a
proper evaluation, compare learning outcomes with a baseline or a control
group, rather than treating app usage as proof of learning.

**5. Why did you include a demo course?**  
It lets a reviewer see the full flow without first finding files or configuring
an API key. When the key is missing, the interface labels the built-in quiz as
sample content instead of presenting it as an AI response.

### RAG and AI

**6. What does RAG mean here?**  
Retrieval-Augmented Generation. The app first finds relevant chunks from the
student's sources. It then gives those chunks to the model as evidence for
question generation or an explanation.

**7. Where does retrieval happen?**  
In `src/lib/retrieval.ts`. The server splits each source into paragraph-sized
chunks, tokenizes the request and chunks, scores them by overlapping terms,
and returns the highest-scoring passages.

**8. Is this semantic or vector search?**  
No. This version uses lexical token overlap with a small frequency score. It
is simple and requires no embedding model or vector database, but may miss
synonyms and paraphrases. Embeddings or hybrid retrieval are a logical next
step, after measuring retrieval quality.

**9. How are citations kept grounded?**  
The server gives each retrieved passage an ID. The model must select an ID;
the server rejects IDs it did not retrieve and attaches the original source
name and excerpt itself. The model does not author the displayed citation
text.

**10. Do citations prove that every generated claim is correct?**  
No. They prove which retrieved passage was attached, not that the model
interpreted it correctly. A stronger product would verify that the answer is
entailed by the cited text and test citation precision with a curated dataset.

**11. What happens when the source has no answer?**  
If retrieval finds no overlapping evidence, the API returns a `422` response
instead of asking the model to answer from memory. The explanation prompt also
instructs the model to say when evidence is insufficient. More robust
confidence thresholds are future work.

**12. How do you reduce hallucinations?**  
Retrieve before generating; keep the prompt evidence-only; use low temperature;
require structured output; constrain the citation to a retrieved evidence ID;
and show the passage. These controls reduce risk, but they do not eliminate
hallucinations.

**13. How do you handle prompt injection inside an uploaded document?**  
The system prompt treats the uploaded evidence as untrusted reference text,
not instructions. That is a useful defense, not a complete security boundary.
For production, I would add adversarial tests, stricter input handling, and
careful review of model output.

**14. Why use structured output?**  
The quiz UI needs a predictable shape: five questions, four options, an answer
index, an explanation, and an evidence ID. A Zod schema lets the AI SDK
validate that shape before the route returns it.

**15. Which model and SDK does it use?**  
The route uses the Vercel AI SDK with `@ai-sdk/groq` and
`llama-3.3-70b-versatile`. The model runs on the server, and its API key is
read from `GROQ_API_KEY`.

**16. Is answer grading performed by AI?**  
No. The quiz response contains an answer index, and the browser compares it
with the student's selected index. That makes scoring deterministic. The
generated explanation is displayed for review. In production, generated
answers should be checked and benchmarked carefully.

### Application and data

**17. How is PDF text extracted?**  
PDF.js reads selectable text in the browser, page by page. TXT and Markdown
files are read as text. This does not perform OCR, so image-only scans need an
OCR feature.

**18. Where is user data stored?**  
The demo session, material text, study-time settings, and quiz attempts are in
browser local storage. That supports a no-database demo but is not secure
multi-user persistence and does not sync across devices.

**19. Are uploaded files sent to an AI provider?**  
Not just by uploading. Text is sent to the server and then Groq when the
student requests an AI quiz or explanation. The privacy notice explains this.
Users should not upload sensitive records without reviewing the provider's
data policy.

**20. How do you protect the API key?**  
It is a server-side environment variable, not a `NEXT_PUBLIC_` value. The
browser calls our API route; it never receives the Groq secret. For Vercel,
the key belongs in project environment settings.

**21. Is the demo login real authentication?**  
No. It is a local entry screen so a judge can try the prototype without
creating an account. A real release needs authentication, server-side
authorization, and per-user data isolation.

**22. How does the revision plan adapt?**  
It uses the latest score per topic. Lower-scoring topics receive more priority,
and topics mentioned in a past-paper source receive an additional priority
boost. The student can set days to the exam and hours per day; taking another
quiz recalculates the order.

**23. Is the schedule generated by the LLM?**  
No. It is a transparent heuristic. That makes the prototype predictable and
easy to explain. A future planner could use an optimizer, but it should keep
time constraints and the priority rules visible to the student.

**24. How do you handle large files and API input?**  
The browser limits each source to 80,000 characters, with at most eight
sources and 400,000 characters total. The API validates the same limits.
Retrieval only includes the top few chunks in the model prompt. A production
system would also enforce request-body limits and use server-side file storage
and asynchronous processing.

**25. What happens if Groq is unavailable or the key is missing?**  
The API returns an explicit error. If the built-in demo materials are active
and no key is configured, the quiz flow offers its clearly labeled sample
quiz. Custom materials do not silently fall back to fabricated AI output.

### Testing, trade-offs, and next steps

**26. How would you test the retrieval quality?**  
Build a small set of student questions with human-identified supporting
passages. Measure whether the correct passage appears in the top results
(recall@k), whether the selected citations support the generated answer, and
how often retrieval returns no useful evidence. Then compare lexical,
embedding, and hybrid approaches.

**27. How would you test the full flow?**  
Unit-test topic extraction, retrieval ranking, score thresholds, and plan
ordering. Add API tests for malformed requests, no evidence, invalid evidence
IDs, and provider errors. Add end-to-end tests for upload, quiz submission,
report display, persistence after reload, and the demo fallback.

**28. What are the main limitations?**  
The retriever is lexical; topic extraction is heuristic; scanned PDFs have no
OCR; local storage is not a secure database; demo login is not authentication;
and generated questions can still be wrong. The planner is rule-based and has
not been empirically validated.

**29. What would you improve next?**  
First, add evaluation data and tests for retrieval and answer quality. Then
consider hybrid or embedding retrieval, page-level PDF citations, persistent
per-user storage and real authentication, rate limiting, and teacher/class
analytics—only after addressing privacy and access control.

**30. Why did you choose this stack?**  
Next.js provides the web UI and server API in one deployable project. TypeScript
helps keep the quiz, citation, and request shapes consistent. The Vercel AI SDK
and Groq provider connect to a hosted model, while local storage and a seeded
course keep the demo simple to run.

## Quick concept refresh

- **Chunking:** Break source text into manageable passages before retrieval.
- **Retrieval:** Select passages likely to contain information relevant to a
  topic or question.
- **Generation:** Ask the model to produce a quiz or explanation using those
  passages.
- **Citation grounding:** Attach a source excerpt chosen from retrieved
  evidence, not free-form citation text from the model.
- **Weak/medium/strong thresholds:** `<60%` weak, `60–79%` medium, `80%+`
  strong.
- **RAG trade-off:** Better grounding than an unconstrained chatbot, but
  quality still depends on source parsing, retrieval, model behavior, and
  evaluation.

## Demo checklist

1. Sign in as the demo student.
2. Show the sample source library and topic map.
3. Start a diagnostic and point out each citation.
4. Submit answers, including one wrong answer, and explain the gap report.
5. Show the changed revision plan and adjust the study window.
6. Open the study coach and explain that it only answers when `GROQ_API_KEY`
   is configured.
7. Explain that demo progress is browser-local and the demo sign-in is not
   production authentication.
