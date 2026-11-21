# CourseSmith

Local web app that keeps course folders in sync with the Notion **Student OS Dashboard**.

- **Setup** – lists the courses from the dashboard's Courses database and lets you map each one to a local folder containing `Resources/` and `Assignments/`.
- **Scan** – queues a `note` job for every resource file without a matching page in the Notes database, and an `assignment` job for every assignment brief without a page in the Assignments database.
- **Topic notes** – queues a `topic` job for extra notes on a topic, based on the course's primary resource (the list under the "Primary Resources" heading on the course page).

Jobs are processed by the worker (Devin, through the Notion connector): it reads the source file, writes the note or the formatted assignment draft (`<brief> - Submission.docx`, saved next to the brief), creates the Notion page with the course relation, and marks the job done.

## Getting started

1. **Install** Node.js 18+, Python 3 and `pip install python-docx`, then clone this repo.
2. **Notion:** make your own copy of the dashboard ([Notion setup](#notion-setup)).
3. **Devin:** install the Devin CLI and connect it to Notion once ([Devin setup](#devin-setup)).
4. **Run:** double-click the launcher for your OS ([Run](#run)), connect your dashboard, add your course folders and click **Scan folders**.
5. **Process:** click **Process with Devin** ([Daily use](#daily-use)).

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

The app starts the [Devin CLI](https://docs.devin.ai/work-with-devin/devin-cli) on your computer for you, so there is nothing to paste. One-time setup:

1. **Devin account:** sign up at [app.devin.ai](https://app.devin.ai).
2. **Install the Devin CLI:**
   - Windows: run the [installer](https://static.devin.ai/cli/devin-updater-x86_64-pc-windows.exe) ([ARM64](https://static.devin.ai/cli/devin-updater-aarch64-pc-windows.exe)), or in PowerShell: `irm https://static.devin.ai/cli/setup.ps1 | iex`
   - macOS / Linux: `curl -fsSL https://cli.devin.ai/install.sh | bash` (or `brew install --cask devin-cli` on macOS)
3. **Sign in:** open a new terminal and run `devin auth login`.
4. **Connect Notion:** in the CourseSmith folder, run `devin mcp login notion` and allow access to your copy of the dashboard. The Notion server is already configured in `.devin/mcp_config.json`.
5. **Restart CourseSmith** so it sees the newly installed `devin` command.

## Daily use

1. Start CourseSmith, add any new files to your course folders and click **Scan folders**. Request topic notes if you want them.
2. Click **Process with Devin**, or tick **Start Devin automatically after a scan**. A terminal window opens where Devin writes the notes and assignment drafts, creates the Notion pages with the course linked, and marks each job done.
3. Finished jobs show a link to their Notion page in the app. Close the terminal when Devin is done.

Devin runs in [Smart mode](https://docs.devin.ai/cli/reference/permissions#smart-mode): routine actions run on their own, and riskier ones (such as installing packages) ask in the terminal first. To change this, set `COURSESMITH_DEVIN_MODE` (for example `bypass` to never ask, or `normal` to always ask) before starting CourseSmith.

No CLI? You can also start a session at [app.devin.ai](https://app.devin.ai), connect the Notion MCP there, and ask: *Process my CourseSmith queue at <folder path> on my computer. Request access to my machine, then follow AGENTS.md.*

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
