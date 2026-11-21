#!/usr/bin/env python3
"""Render a Markdown-ish draft to .docx: python3 tools/make_docx.py draft.md out.docx
Supports '# ' / '## ' / '### ' headings, '- ' bullets, '1. ' numbered items, '|' tables and paragraphs."""
import sys
from docx import Document
from docx.shared import Pt

src, out = sys.argv[1], sys.argv[2]
doc = Document()
doc.styles["Normal"].font.size = Pt(12)
lines = open(src, encoding="utf-8").read().splitlines()
i = 0
while i < len(lines):
    line = lines[i].rstrip()
    if line.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].startswith("|"):
            cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
            if not all(set(c) <= set("-: ") for c in cells):
                rows.append(cells)
            i += 1
        table = doc.add_table(rows=len(rows), cols=len(rows[0]))
        table.style = "Table Grid"
        for r, row in enumerate(rows):
            for c, val in enumerate(row):
                table.cell(r, c).text = val
                if r == 0:
                    for run in table.cell(r, c).paragraphs[0].runs:
                        run.bold = True
        continue
    if line.startswith("### "):
        doc.add_heading(line[4:], level=3)
    elif line.startswith("## "):
        doc.add_heading(line[3:], level=2)
    elif line.startswith("# "):
        doc.add_heading(line[2:], level=1)
    elif line.startswith("- "):
        doc.add_paragraph(line[2:], style="List Bullet")
    elif len(line) > 2 and line.split(". ")[0].isdigit():
        doc.add_paragraph(line.split(". ", 1)[1], style="List Number")
    elif line.startswith("```"):
        pass
    elif line:
        doc.add_paragraph(line)
    i += 1
doc.save(out)
print(out)
