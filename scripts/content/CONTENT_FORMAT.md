# 369 Product content format (Products 4 & 5)

You write ONE JSON file: a part of a product. It is loaded straight into the database and
rendered by the lesson player. Valid JSON only (no comments, no trailing commas).

## Source of truth
The product specification markdown file you are given. Do NOT invent a different structure,
do NOT rename modules, do NOT add modules. Use the spec's lessons (e.g. 1.1, 1.2, 1.3) as
the lessons of each module, in order, with the spec's titles. You expand each lesson into
teaching content faithful to the spec. Spec worksheets/exercises/quizzes/outputs must appear.

## File shape
{
  "modules": [
    {
      "position": 1,                       // module number from the spec
      "title": "Understand Your Productivity Patterns",   // exact spec title
      "summary": "1-2 sentences: what this module is and why it matters.",
      "outcome": "What the customer has at the end, e.g. 'Your Personal Productivity Profile'",
      "lessons": [
        {
          "position": 1,
          "title": "Why Productivity Systems Fail",       // spec lesson title without the 1.1 number
          "summary": "One sentence shown in the course outline (public, no paid detail).",
          "est_minutes": 8,
          "sections": [ ...see below... ]
        }
      ]
    }
  ],
  "resources": [ ...see below... ]
}

## Lesson sections (in this order)
Every lesson follows Learn → See It → Try It → Use It → Test Yourself → Complete.

1. { "kind": "overview", "what": "...", "why": "...", "do": "...", "output": "..." }
   - what  = WHAT IS THIS? (1-2 sentences)
   - why   = WHY DOES IT MATTER? (1-2 sentences)
   - do    = WHAT DO I DO? (1 sentence, concrete)
   - output= WHAT WILL I HAVE WHEN I'M DONE? (short noun phrase)
2. { "kind": "learn", "title": "Learn", "markdown": "..." }   core teaching, 150-300 words.
   Markdown allowed: paragraphs, **bold**, bullet lists (- ), numbered lists (1. ), > quotes. No headings above ###, no tables, no images, no links.
3. { "kind": "see_it", "title": "See it", "markdown": "..." }  one concrete worked example, 60-150 words.
4. { "kind": "try_it", "title": "Try it", "markdown": "...", "resource": "<resource key or omit>" }
   a small guided exercise (5-10 min). If a resource from the vault fits, reference its key.
5. { "kind": "use_it", "title": "Use it", "markdown": "...", "resource": "<resource key or omit>" }
   how to apply it in real life this week (40-120 words).
6. { "kind": "quiz", "questions": [ { "q": "...", "options": ["A","B","C","D"], "answer": 1, "explain": "why" } ] }
   1-2 questions per lesson, 3-4 options, "answer" = 0-based index. Use the spec's quiz where given.
7. { "kind": "complete", "markdown": "..." }  2-4 bullet checklist of what they now have / did.

Total per lesson roughly 350-650 words. Plain, warm, practical English. Short sentences.
International audience (many South African readers): avoid US-only references.

## Resources (the Resource Vault)
Each vault item from the spec that belongs to YOUR modules becomes one resource.
Keys: lowercase-kebab, prefixed by product: "p4-" (ADHD) or "p5-" (Budget), e.g. "p4-brain-dump".
{
  "key": "p4-brain-dump",
  "title": "Brain Dump",              // spec vault name
  "kind": "worksheet" | "template" | "tracker" | "checklist" | "tool",
  "module": 2,                        // module position it belongs to
  "content": <one of the types below>
}

Resource content types (interactive in the app; the app also exports CSV):

A) form — one-off worksheet
{ "type": "form", "intro": "1-2 sentences", "fields": [
   { "id": "snake_case", "label": "...", "input": "text|textarea|number|currency|date|select|rating|list",
     "options": ["only for select"], "help": "optional hint", "placeholder": "optional" } ] }
   rating = 1-5 scale. list = user adds any number of short text items.

B) table — tracker/planner with rows (spreadsheet-ready)
{ "type": "table", "intro": "...", "columns": [
   { "id": "snake_case", "label": "...", "input": "text|number|currency|date|select|checkbox|percent",
     "options": ["for select"], "formula": "optional, see below" } ],
  "starter_rows": [ { "col_id": "example value" } ],   // optional 0-3 example rows, clearly examples
  "totals": ["col_id", ...],                            // optional: columns summed in a footer row
  "formula_notes": "plain-English explanation of every formula (required if any formula)" }
  formula = arithmetic over OTHER numeric column ids of the same row: + - * / and parentheses,
  e.g. "target - current", "planned - actual", "(target - current) / periods_left".
  A formula column is read-only. Division by zero shows blank. No other functions.

C) checklist
{ "type": "checklist", "intro": "...", "items": ["...", "..."] }

D) builder — ONLY for the final module OS builder (p4-productivity-os-builder / p5-money-os-builder)
{ "type": "builder", "intro": "...", "pulls": ["resource keys whose saved answers are shown as the user's system"],
  "fields": [ same as form fields — the user's final rules/decisions ] }

Lessons reference resources via "resource" in try_it/use_it. Every resource you create
must be referenced by at least one lesson of yours. Only reference keys that exist
(yours, or keys listed as belonging to the other half in your brief).

## Safety rules
Product 4: productivity/organization support only. Never diagnose, never claim to treat ADHD,
no medication talk, no "cure". It is fine to say "people who experience ADHD-style challenges".
Product 5: general budgeting/organization education only. No individualized investment, tax,
legal, credit or financial-planning advice. No promised outcomes. Never call one debt strategy
or one emergency-fund number universally correct. Where country rules matter, tell the user to
check an official or qualified source. Examples are illustrative, use round neutral numbers.

## Output
Write only your JSON file to the path in your brief, then run:
  python3 /home/claude/content/validate.py <your file>
and fix every error until it prints OK. Reply with: file path, module count, lesson count,
resource keys, total words (from the validator).
