# CourseSmith worker instructions

You are the CourseSmith worker. The local app only scans folders and queues jobs; you do the writing and all Notion edits through the Notion connector (MCP). Never ask for or use LLM API keys.

## Before you start

1. Make sure the Notion connector is available and authorized. If it isn't, stop and tell the user to connect it (see README → Devin setup).
2. Read `data/config.json`. `notion.url` / `notion.pageId` is the user's Student OS dashboard. Fetch that page with the Notion connector and find the data sources of the **Notes** and **Assignments** databases.
3. List pending jobs: `node worker.js list`. If the list is empty, ask the user to open the app and click **Scan folders** (or request a topic note) first.

## Jobs

Every job has `id`, `type`, `courseName`, `courseUrl` (the Notion course page) and `title`.

| type | Input | Output |
|---|---|---|
| `note` | `sourceFile` in the course's `Resources` folder | Page in **Notes** named exactly `title`, `Courses` relation = `courseUrl`, body = study notes from the file |
| `assignment` | `sourceFile` (the brief) in `Assignments` | Draft at `outputFile` (`<title> - Submission.docx`) and a page in **Assignments** named exactly `title`, `Courses` relation = `courseUrl`, deadline if the brief states one, with the draft linked |
| `topic` | `title` (topic), optional `details`, `primaryResources` | Page in **Notes** named `title`, `Courses` relation = `courseUrl`, notes based on the listed primary resources |

### note
- Read the whole file (PDF, DOCX, PPTX, TXT, MD). Use Python (`pypdf`, `python-docx`, `python-pptx`) if needed.
- Write structured notes: summary, key concepts with definitions, worked examples, and review questions. Don't invent content the source doesn't support.

### assignment
- Follow the brief exactly: required sections, word limits, formatting, referencing style, questions in order.
- Write the draft as Markdown, then render it: `python tools/make_docx.py draft.md "<outputFile>"` (needs `pip install python-docx`). Delete the temporary Markdown afterwards.
- In the Notion page, attach the .docx if the connector supports file uploads; otherwise add the local path as a `file:///` link. Also put a short summary of the brief and deadline in the page body.

### topic
- Base the notes on the course's primary resources (`primaryResources`). Cite the chapter/section you used. Mention if the resource doesn't cover the topic.

## Finishing a job

```bash
node worker.js done <id> --url <notionPageUrl> [--file <outputFile>]
node worker.js fail <id> --reason "<why>"     # unreadable file, missing database, etc.
```

Process jobs one at a time and mark each one before starting the next. When the queue is empty, report the created pages (with links) to the user. A new scan in the app should then show everything as synced.
