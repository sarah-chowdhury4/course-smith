# CourseSmith

Local web app that keeps course folders in sync with the Notion **Student OS Dashboard**.

- **Setup** – lists the courses from the dashboard's Courses database and lets you map each one to a local folder containing `Resources/` and `Assignments/`.
- **Scan** – queues a `note` job for every resource file without a matching page in the Notes database, and an `assignment` job for every assignment brief without a page in the Assignments database.
- **Topic notes** – queues a `topic` job for extra notes on a topic, based on the course's primary resource (the list under the "Primary Resources" heading on the course page).

Jobs are processed by the worker (Devin, through the Notion connector): it reads the source file, writes the note or the formatted assignment draft (`<brief> - Submission.docx`, saved next to the brief), creates the Notion page with the course relation, and marks the job done.

## Getting started

1. **Install** Node.js 18+, Python 3 and `pip install python-docx`, then clone this repo.
2. **Notion:** make your own copy of the dashboard ([Notion setup](#notion-setup)).
3. **Devin:** connect Notion to Devin once ([Devin setup](#devin-setup)).
4. **Run:** double-click the launcher for your OS ([Run](#run)), connect your dashboard, add your course folders and click **Scan folders**.
5. **Process:** ask Devin to process the queue ([Daily use](#daily-use)).

## Notion setup

CourseSmith reads your dashboard through its public `notion.site` link and writes through the Notion connector, so you need your own copy of the dashboard.

### Option A: duplicate the template (recommended)

1. Open the [Student OS Dashboard template](https://cake-libra-920.notion.site/Student-OS-Dashboard-41f71a199ec68015a64febff21aa81fc) and click **Duplicate** (top right).
2. In your copy, delete the sample courses, notes and assignments, then add your own courses.
3. **Share → Publish** your copy and copy the `notion.site` link.
4. Start CourseSmith and paste that link into **Notion dashboard → Connect**.

### Option B: build it yourself

Create a page with these inline databases. Names must match exactly.

| Database | Properties |
|---|---|
| **Courses** | `Name` (title), `Assignments` (relation → Assignments) |
| **Notes** | `Name` (title), `Courses` (relation → Courses) |
| **Assignments** | `Name` (title), `Courses` (relation → Courses), `Deadline` (date), optional `Days Remaining` (formula) |
| Tasks (optional) | `Name` (title), `Category` (select), `Deadline` (date) |

On each course page, add a heading **Primary Resources** followed by a list of the course's main resources (title, authors, link). Topic notes are based on these.

Then publish the page (step 3 above) and connect it in the app.

Switching to a different dashboard clears the saved course folders, because folders are matched by Notion course ID.

## Devin setup

CourseSmith has no AI of its own and needs no API keys. Devin does the reading and writing, and uses [`AGENTS.md`](AGENTS.md) for the exact steps.

1. **Devin account:** sign in at [app.devin.ai](https://app.devin.ai).
2. **Connect Notion (once):** in Devin, go to **Customize → MCPs → Browse marketplace → Notion**, install it, and finish the Notion sign-in. Give it access to your copy of the dashboard. Details: [Devin MCP docs](https://docs.devin.ai/work-with-devin/mcp).
3. **Let Devin reach your computer:** Devin sessions run in the cloud, so Devin asks for access to your machine to read your course folders and the job queue. Approve the request in [Devin Desktop](https://docs.devin.ai/desktop/introducing-devin-desktop), or run the `devin connect <CODE>` command shown on the request card with the [Devin CLI](https://docs.devin.ai/work-with-devin/local-hands). You approve each command Devin runs unless you turn on bypass.

## Daily use

1. Start CourseSmith, add any new files to your course folders and click **Scan folders**. Request topic notes if you want them.
2. Start a Devin session and paste:

   ```text
   Process my CourseSmith queue. The project is at <full path to your CourseSmith folder> on my computer.
   Request access to my machine, then read AGENTS.md in that folder and follow it.
   ```

3. Approve the machine-access request. Devin writes the notes and assignment drafts, creates the Notion pages with the course linked, and marks each job done.
4. Refresh CourseSmith. Finished jobs show a link to their Notion page, and a new scan shows everything as synced.

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
