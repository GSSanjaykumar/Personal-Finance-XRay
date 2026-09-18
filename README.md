

````markdown
# Personal Finance X-Ray

### Financial Statement Analysis & Spending Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## Overview

Personal Finance X-Ray is a financial statement analysis application that converts bank statement PDFs into structured transaction data and provides financial insights.

The current system focuses on statement ingestion, transaction processing, merchant identification, financial analytics, budgeting, and a FastAPI backend.

---

## Features

- Bank statement PDF parsing
- Transaction extraction and normalization
- Merchant identification using a merchant database
- Transaction categorization
- Income and expense analysis
- Category-wise spending analysis
- Savings calculation
- Recurring transaction detection
- Budget tracking and analysis
- Financial health scoring
- FastAPI REST API
- React-based frontend

---

## Architecture

```text
Bank Statement PDF
        |
        v
   PDF Parser
        |
        v
Transaction Processing
        |
        v
  Normalization
        |
        v
Merchant Matching
        |
        v
Structured Transactions
        |
        +-------------------+
        |         |         |
        v         v         v
   Statistics  Spending  Recurring
               Analysis  Detection
        |         |         |
        +---------+---------+
                  |
                  v
         Financial Analysis
                  |
                  v
             FastAPI API
                  |
                  v
            React Frontend
````

---

## How It Works

### 1. Statement Parsing

The application accepts a bank statement PDF and extracts transaction information.

### 2. Transaction Processing

Extracted transactions are converted into a consistent structure containing information such as date, description, amount, transaction type, balance, merchant, and category.

### 3. Merchant Matching

Transaction descriptions are normalized and matched against the merchant database.

```text
Raw Description
       |
       v
Normalization
       |
       v
Merchant Matching
       |
       v
Merchant + Category
```

### 4. Financial Analysis

The processed transactions are used to calculate:

* Total income
* Total expenses
* Net savings
* Transaction count
* Category-wise spending
* Spending percentages
* Largest transactions

### 5. Recurring Transactions

Transaction history is analyzed to identify merchants that appear repeatedly.

### 6. Budget Analysis

Configured category budgets are compared with actual spending.

### 7. Financial Health

A basic financial health score is calculated using income, expenses, savings, and spending ratios.

---

## Tech Stack

### Backend

* Python
* FastAPI
* Uvicorn
* Pandas
* PDFPlumber

### Frontend

* React
* Vite
* JavaScript
* Axios
* Recharts
* React Router
* Tailwind CSS

### Data Processing

* Pandas
* Python Dataclasses
* CSV-based Merchant Database

---

## Project Structure

```text
Personal-Finance-XRay/
│
├── analytics/
├── backend/
├── datasets/
├── frontend/
├── intelligence/
├── parsers/
├── main.py
├── requirements.txt
├── .gitignore
└── README.md
```

---

## API

The backend is built using FastAPI.

### Health Check

```http
GET /health
```

### Upload Statement

```http
POST /upload
```

### Budget

```http
GET /budget
PUT /budget
```

### Budget Analysis

```http
GET /budget-analysis
```

### API Documentation

When the backend is running:

```text
http://localhost:8000/docs
```

---

## Installation

### Backend

Create a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn backend.app:app --reload
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Project Status

**Active Development**

### Completed

* [x] PDF statement parsing
* [x] Transaction extraction
* [x] Transaction normalization
* [x] Merchant matching
* [x] Transaction categorization
* [x] Financial statistics
* [x] Spending analysis
* [x] Recurring transaction detection
* [x] Budget analysis
* [x] Financial health scoring
* [x] FastAPI backend

### In Progress

* [ ] Frontend refinement
* [ ] Additional statement formats
* [ ] Improved transaction classification
* [ ] Additional financial insights

---

## Roadmap

* [ ] Support more bank statement formats
* [ ] Improve transaction classification
* [ ] Improve recurring-payment detection
* [ ] Unusual spending detection
* [ ] Expense forecasting
* [ ] Machine learning-based categorization
* [ ] Semantic search
* [ ] RAG-based financial assistant
* [ ] LLM-powered financial insights

---

## Disclaimer

This project is developed for educational and software development purposes.

It is not intended to provide professional financial advice.

---

## Author

**Sanjay**

B.E. Computer Science and Engineering (AI & ML)
Rajalakshmi Institute of Technology


