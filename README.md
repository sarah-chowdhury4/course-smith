# CourseSmith

A local web app that keeps your course folders and your Notion **Student OS** dashboard in sync. Devin does the writing.

## What it does and the problem it solves

Students collect lecture slides, readings and assignment briefs in folders on their computer, but plan their semester in Notion. Keeping the two in step means writing notes for every new file, adding each assignment to Notion, and starting every assignment from a blank page. CourseSmith automates that.

Each course gets a local folder with two subfolders, `Resources/` and `Assignments/`. CourseSmith then:

- **Notes for resources:** every file in `Resources/` without a matching page in the Notes database gets study notes, saved to Notion with the same title and linked to its course.
- **Assignment drafts:** every brief in `Assignments/` without a page in the Assignments database gets a draft that follows the brief's instructions. The draft is saved next to the brief as `<brief> - Submission.docx`, and a Notion page with the same name links to it and to the course.
- **Topic notes on request:** ask for notes on any topic for a course. They are based on the course's primary resources, read from the course page in Notion.

The app has no AI of its own and needs no LLM API keys. It scans the folders, compares them with Notion and queues the missing work. Devin then processes the queue.

## How we used Devin Chat

- **Building it:** CourseSmith was planned and built in a single Devin Chat session. We brainstormed and scoped the idea, then Devin inspected the Notion dashboard's structure, wrote the app, tested it against the live dashboard, and added the cross-platform launchers and this README. It also set up the GitHub repository on the user's computer.
- **As the worker:** instead of calling an LLM API, the app hands its job queue to Devin. In the chat session, Devin read sample resources and briefs, wrote the notes and `.docx` drafts, and created the Notion pages through the Notion MCP, with course relations set. A fresh scan then showed everything as synced.
- **For any user:** the **Process with Devin** button opens the [Devin CLI](https://docs.devin.ai/work-with-devin/devin-cli) on the user's own computer with the job prompt. Devin follows [`AGENTS.md`](AGENTS.md), which tells it how to handle each job type. If you don't use the CLI, you can paste the same request into Devin Chat at [app.devin.ai](https://app.devin.ai): *Process my CourseSmith queue at <folder path> on my computer. Request access to my machine, then follow AGENTS.md.*

## How it uses Notion Student OS

CourseSmith is built around the [Student OS Dashboard](https://cake-libra-920.notion.site/Student-OS-Dashboard-41f71a199ec68015a64febff21aa81fc) template:

| Student OS database | How CourseSmith uses it |
|---|---|
| **Courses** | Lists your courses on the setup screen, where you map each one to a folder. The **Primary Resources** list on each course page is the source for topic notes. |
| **Notes** | Checked for a note matching each resource file. New notes are added here and linked to their course. |
| **Assignments** | Checked for a page matching each brief. New pages link to the draft and the course, with the deadline if the brief states one. |

- **Reading:** the app reads the dashboard live through its published `notion.site` link, so new courses, notes and assignments show up straight away.
- **Writing:** all writes go through the Notion MCP that Devin uses.
- **Other users' courses:** folders are matched by Notion course ID, so a duplicated dashboard with different courses works too. Switching to another dashboard clears the saved folder mappings.

### Get your own copy

**Option A: duplicate the template (recommended)**

1. Open the [template](https://cake-libra-920.notion.site/Student-OS-Dashboard-41f71a199ec68015a64febff21aa81fc) and click **Duplicate** (top right).
2. Delete the sample courses, notes and assignments, then add your own courses.
3. Go to **Share → Publish** and copy the `notion.site` link.

**Option B: build it yourself.** Create a page with these inline databases. The names must match exactly.

| Database | Properties |
|---|---|
| **Courses** | `Name` (title), `Assignments` (relation → Assignments) |
| **Notes** | `Name` (title), `Courses` (relation → Courses) |
| **Assignments** | `Name` (title), `Courses` (relation → Courses), `Deadline` (date), optional `Days Remaining` (formula) |
| Tasks (optional) | `Name` (title), `Category` (select), `Deadline` (date) |

On each course page, add a **Primary Resources** heading followed by a list of the course's main resources (title, authors, link). Then publish the page as in step 3.

## Running and testing

### 1. Install

- [Node.js](https://nodejs.org) 18+, Python 3 and `pip install python-docx` (for assignment drafts)
- Clone the repo: `git clone https://github.com/sarah-chowdhury4/course-smith.git`

### 2. Set up Devin (once)

1. Sign up at [app.devin.ai](https://app.devin.ai).
2. Install the Devin CLI:
   - **Windows:** run the [installer](https://static.devin.ai/cli/devin-updater-x86_64-pc-windows.exe) ([ARM64](https://static.devin.ai/cli/devin-updater-aarch64-pc-windows.exe)), or in PowerShell run `irm https://static.devin.ai/cli/setup.ps1 | iex`
   - **macOS / Linux:** `curl -fsSL https://cli.devin.ai/install.sh | bash` (or `brew install --cask devin-cli` on macOS)
3. Open a new terminal and run `devin auth login`.
4. In the CourseSmith folder, run `devin mcp login notion` and allow access to your copy of the dashboard. The Notion server is already configured in `.devin/mcp_config.json`.

### 3. Start the app

Double-click the launcher for your OS. It starts the server and opens http://localhost:4321. Close the window to stop it.

| OS | Launcher | First-time note |
|---|---|---|
| Windows | `Start CourseSmith (Windows).bat` | None |
| macOS | `Start CourseSmith (Mac).command` | If macOS blocks it, right-click → Open once |
| Linux | `Start CourseSmith (Linux).sh` | Allow running as a program (in the file manager or with `chmod +x`) |

Or run `npm start` (or `npm run open` to also open the browser). There are no npm dependencies.

### 4. Use it

1. **Notion dashboard:** paste your published `notion.site` link and click **Connect**. Your courses appear.
2. **Course folders:** enter a folder path for each course, then click **Save folders** and **Scan folders**. The scan report shows which files are already in Notion and which were queued.
3. **Topic notes (optional):** pick a course, enter a topic and click **Request notes**.
4. **Process with Devin:** click the button, or tick **Start Devin automatically after a scan**. A terminal opens where Devin works through the queue. Finished jobs show a link to their Notion page.

By default Devin runs in [Smart mode](https://docs.devin.ai/cli/reference/permissions#smart-mode). Routine actions run on their own, and riskier ones (such as package installs) ask first in the terminal. To change this, set `COURSESMITH_DEVIN_MODE` (`bypass` or `normal`) before starting the app.

### Quick test

1. Create a test folder like this:

   ```
   Test Course/
     Resources/Week 1 - Introduction.txt      (paste any lecture text)
     Assignments/Assignment 1 - Essay.txt     (a short brief, e.g. "500-word essay on ..., due 1 Dec")
   ```

2. Map it to one of your courses and click **Scan folders**. Expect 2 new jobs.
3. Click **Process with Devin**. Expect a **Week 1 - Introduction** note and an **Assignment 1 - Essay** page in Notion, both linked to the course, plus `Assignment 1 - Essay - Submission.docx` in `Assignments/`.
4. Scan again. Both files now show as "in Notion" and no new jobs are added.

### Project layout

| Path | Purpose |
|---|---|
| `server.js`, `public/` | Local web app and API |
| `lib/notion.js` | Reads the published dashboard |
| `lib/scan.js` | Compares folders with Notion and builds jobs |
| `lib/devin.js` | Opens the Devin CLI in a terminal |
| `worker.js` | Job queue CLI Devin uses: `list`, `done <id> --url …`, `fail <id> --reason …` |
| `tools/make_docx.py` | Renders a Markdown draft to `.docx` |
| `AGENTS.md` | Instructions Devin follows for each job |
| `data/` | Local config and job queue (not committed) |
