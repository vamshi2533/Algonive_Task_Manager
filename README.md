# TaskFlow – Task Manager

A clean, web-based task management system built with vanilla HTML, CSS, and JavaScript.

## Project Structure

```
taskflow/
├── index.html   ← App markup & layout
├── style.css    ← All styles (dark theme, animations, responsive)
├── app.js       ← All logic (CRUD, filters, reminders, storage)
└── README.md
```

## Features

- **Add tasks** with title, description, due date, and priority (High / Normal / Low)
- **Edit & Delete** tasks via hover action buttons on each card
- **Mark complete / incomplete** with an animated checkbox toggle
- **Filter tasks** — All · Pending · Completed · Overdue · Due Soon
- **Reminder banner** — alerts you when tasks are overdue or due within 2 days
- **Local Storage** — tasks persist across page refreshes automatically
- **Responsive UI** — works on desktop and mobile

## How to Run

No build step required. Just open `index.html` in any modern browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows — double-click index.html, or:
start index.html
```

Or serve locally with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).  
Requires JavaScript enabled.
