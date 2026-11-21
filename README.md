# CourseSmith

Local web app that keeps course folders in sync with the Notion **Student OS Dashboard**.

- **Setup** – lists the courses from the dashboard's Courses database and lets you map each one to a local folder containing `Resources/` and `Assignments/`.
- **Scan** – queues a `note` job for every resource file without a matching page in the Notes database, and an `assignment` job for every assignment brief without a page in the Assignments database.
- **Topic notes** – queues a `topic` job for extra notes on a topic, based on the course's primary resource (the list under the "Primary Resources" heading on the course page).

Jobs are processed by the worker (Devin, through the Notion connector): it reads the source file, writes the note or the formatted assignment draft (`<brief> - Submission.docx`, saved next to the brief), creates the Notion page with the course relation, and marks the job done.

## Run

Double-click the launcher for your OS. It starts the server and opens http://localhost:4321 in your browser (if the server is already running, it just opens the browser). Close the window to stop it.

| OS | Launcher | First-time note |
|---|---|---|
| Windows | `Start CourseSmith (Windows).bat` | None |
| macOS | `Start CourseSmith (Mac).command` | If blocked, right-click → Open once |
| Linux | `Start CourseSmith (Linux).sh` | Allow running as a program (file manager or `chmod +x`) |

Or from a terminal:

```bash
npm start            # http://localhost:4321
npm run open         # same, and opens the browser
```

No dependencies besides Node 18+. Reads use the public `notion.site` API (`NOTION_SITE`, `NOTION_DASHBOARD_ID` env vars to override). Config and the job queue live in `data/`.

## Worker CLI

```bash
node worker.js list                                   # pending jobs
node worker.js done <id> --url <notionPageUrl> [--file <draft>]
node worker.js fail <id> --reason "..."
python3 tools/make_docx.py draft.md "Brief - Submission.docx"   # needs python-docx
```
