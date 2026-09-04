# Expense Tracker

A simple expense tracker web app built with plain HTML, CSS, and JavaScript. Add income and expense transactions, track totals, filter and search your history, and see a category breakdown — all saved locally in your browser.

## How to Run

No build steps or installation required.

1. Download or clone this repository.
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).

That's it — the app runs entirely client-side and stores your data in the browser's Local Storage, so your transactions persist even after refreshing the page.

> Note: the doughnut chart uses [Chart.js](https://www.chartjs.org/) loaded from a CDN, so an internet connection is needed for the chart to render. Everything else works fully offline.

## Features

- **Add transactions** — record income or expenses with amount, category, date, and description
- **Edit and delete** — update or remove any transaction, with a confirmation prompt before deleting
- **Summary totals** — total income, total expenses, and current balance, updated live
- **Monthly summary** — this month's spend, transaction count, and top spending category
- **Category breakdown chart** — a doughnut chart showing where your expense money is going
- **Filter and search** — filter by type (income/expense) or category, search by description/category/date/amount, and filter by a specific date
- **CSV export** — export your current (filtered) transaction list to a CSV file
- **Form validation** — clear inline error messages for missing fields, invalid amounts, and future-dated entries
- **Dark mode** — toggle between light and dark themes (your choice is remembered)
- **Responsive design** — works on both desktop and mobile screen sizes
- **Local Storage persistence** — all data is saved in the browser and survives page refreshes

## Tech Stack

- HTML5
- CSS3 
- Vanilla JavaScript 
- [Chart.js](https://www.chartjs.org/) (via CDN) for the category chart

## File Structure

```
expense-tracker/
├── index.html    # App structure/markup
├── style.css     # Styling, theme, and responsive layout
├── script.js     # App logic — transactions, validation, storage, chart
└── README.md
```