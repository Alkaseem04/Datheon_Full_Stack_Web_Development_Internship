# 🚀 Datheon Full Stack Web Development Internship

### 4 Completed Projects | Full Stack Web Development | Vercel Deployment

Welcome to my **Datheon Full Stack Web Development Internship** repository!

This repository contains four web development projects completed as part of the Datheon internship program. Each project demonstrates practical skills in frontend development, JavaScript programming, API integration, responsive design, and web application deployment.

All four projects are organized into separate folders and deployed independently on **Vercel**.

---

## 🌐 Live Project Demonstrations

Explore the deployed applications using the links below.

| Task | Project | Live Demo | Source Code |
|---|---|---|---|
| Task 1 | Personal Developer Portfolio | [🚀 Live Demo](https://alkaseem-malik-portfolio.vercel.app/) | [View Code](./Task-1-Portfolio) |
| Task 2 | Task Manager | [🚀 Live Demo](https://alkaseem-task-2-task-manager.vercel.app/) | [View Code](./Task-2-Task-Manager) |
| Task 3 | WeatherPulse Dashboard | [🚀 Live Demo](https://alkaseem-task-3-weather-dashboard-78hap8q06.vercel.app/) | [View Code](./Task-3-Weather-Dashboard) |
| Task 4 | ShopSphere E-Commerce Store | [🚀 Live Demo](https://alkaseem-task-4-ecommerce-store.vercel.app/) | [View Code](./Task-4-Ecommerce-Store) |

---

## 📂 Repository Structure

```text
Datheon_Full_Stack_Web_Development_Internship/
│
├── Task-1-Portfolio/
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── package.json
│   └── README.md
│
├── Task-2-Task-Manager/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
│
├── Task-3-Weather-Dashboard/
│   ├── api/
│   │   └── weather.js
│   ├── tests/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── package.json
│   └── README.md
│
├── Task-4-Ecommerce-Store/
│   ├── assets/
│   ├── js/
│   ├── tests/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── package.json
│   └── README.md
│
├── .gitignore
└── README.md
```

Each task has its own source code and project documentation.

---

## 💻 Task 1 — Personal Developer Portfolio

**Project:** Personal Portfolio Website

A modern, responsive portfolio website designed to showcase my professional profile, education, technical skills, projects, and contact information.

### Key Features

- Responsive design for desktop, tablet, and mobile
- Professional introduction and About section
- Technical skills showcase
- Project portfolio with descriptions
- Contact and social profile links
- Interactive user interface

### Technologies Used

HTML5, CSS3, JavaScript, and Vercel.

**Live Website:** [View Personal Portfolio](https://alkaseem-malik-portfolio.vercel.app/)

**Source Code:** [Task 1 Folder](./Task-1-Portfolio)

---

## ✅ Task 2 — Task Manager

**Project:** Task Manager — Stay Organized

A task management web application that allows users to organize their daily activities and manage tasks efficiently.

### Key Features

- Create new tasks with title and description
- Edit existing tasks
- Delete tasks
- Mark tasks as completed
- Filter tasks by All, Active, and Completed
- Assign categories and due dates
- Persist task information using browser local storage
- Responsive user interface

### Technologies Used

HTML5, CSS3, JavaScript, Browser Local Storage, and Vercel.

**Live Website:** [View Task Manager](https://alkaseem-task-2-task-manager.vercel.app/)

**Source Code:** [Task 2 Folder](./Task-2-Task-Manager)

---

## ☁️ Task 3 — WeatherPulse Weather Dashboard

**Project:** WeatherPulse — Live Weather Dashboard

A responsive weather application that displays current weather conditions and forecasts for cities around the world using an external weather API.

### Key Features

- Search weather information by city
- Display current temperature and weather conditions
- Humidity, wind speed, and atmospheric pressure
- Five-day weather forecast
- Weather-based visual themes
- Loading indicators and error handling
- Responsive dashboard interface
- API integration using a Vercel Serverless Function

### Technologies Used

HTML5, CSS3, JavaScript, WeatherAPI.com, Node.js, and Vercel Serverless Functions.

### API Configuration

This project requires a WeatherAPI.com API key.

Create a `.env.local` file inside the Task 3 directory:

```env
WEATHER_API_KEY=your_weatherapi_key_here
```

For production deployment, configure `WEATHER_API_KEY` in the Vercel project's Environment Variables.

**Security:** API keys and local environment files must not be committed to the public repository.

**Live Website:** [View WeatherPulse Dashboard](https://alkaseem-task-3-weather-dashboard-78hap8q06.vercel.app/)

**Source Code:** [Task 3 Folder](./Task-3-Weather-Dashboard)

---

## 🛒 Task 4 — ShopSphere E-Commerce Store

**Project:** ShopSphere — E-Commerce Storefront

A responsive e-commerce storefront that provides a product browsing and shopping cart experience using a public product API.

### Key Features

- Dynamic product catalog
- Product data integration using FakeStoreAPI
- Search products by name
- Filter products by category
- Product sorting
- Add and remove products from cart
- Update cart quantities
- Calculate cart totals
- Demonstration checkout experience
- Responsive layout for different screen sizes

### Technologies Used

HTML5, CSS3, JavaScript, FakeStoreAPI, Browser Storage, and Vercel.

**Note:** Checkout is a demonstration flow and does not process real payments.

**Live Website:** [View ShopSphere Store](https://alkaseem-task-4-ecommerce-store.vercel.app/)

**Source Code:** [Task 4 Folder](./Task-4-Ecommerce-Store)

---

## 🛠️ Technologies and Tools

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| API Integration | WeatherAPI.com, FakeStoreAPI |
| Backend / Serverless | Node.js, Vercel Serverless Functions |
| Data Persistence | Browser Local Storage |
| Version Control | Git and GitHub |
| Deployment | Vercel |
| Development Environment | VS Code / Antigravity IDE |
| Testing | Node.js Test Runner |

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Alkaseem04/Datheon_Full_Stack_Web_Development_Internship.git
```

### 2. Navigate to the Repository

```bash
cd Datheon_Full_Stack_Web_Development_Internship
```

### 3. Open a Project

For example:

```bash
cd Task-2-Task-Manager
```

Tasks 1, 2, and 4 can be explored using their HTML entry points or a local development server.

For Task 3, configure the required environment variable and use the Vercel development environment to run its serverless API.

Refer to each task's individual `README.md` for project-specific instructions.

---

## 🧪 Testing

The projects include functional testing and verification of key features.

- **Task 1:** Responsive layout, navigation, and portfolio sections
- **Task 2:** Task creation, editing, deletion, completion, filtering, and persistence
- **Task 3:** Weather API integration, search, error handling, and dashboard behavior
- **Task 4:** Product catalog, cart operations, filtering, pricing, and checkout demonstration

For projects with automated tests, navigate to the relevant task directory and run:

```bash
npm test
```

---

## 🚀 Deployment

All four projects have been deployed as independent applications on Vercel.

| Application | Hosting |
|---|---|
| Personal Portfolio | Vercel |
| Task Manager | Vercel |
| WeatherPulse Dashboard | Vercel |
| ShopSphere Store | Vercel |

The live application links are provided in the **Live Project Demonstrations** section at the top of this README.

---

## 👨‍💻 Developer

**Alkaseem Malik**

**Role:** AI/ML Engineer | Full-Stack Developer

**GitHub:** [Alkaseem04](https://github.com/Alkaseem04)

**LinkedIn:** [Alkaseem Malik](https://linkedin.com/in/alkaseem-malik-653374329)

**Portfolio:** [Visit My Portfolio](https://alkaseem-malik-portfolio.vercel.app/)

---

## 🎓 Internship Information

| Detail | Information |
|---|---|
| Organization | Datheon |
| Internship Program | Full Stack Web Development |
| Total Assigned Tasks | 4 |
| Completed Tasks | 4 |
| Repository Visibility | Public |
| Deployment Platform | Vercel |
| Version Control | GitHub |

This repository has been prepared for submission and technical review as part of the Datheon Full Stack Web Development Internship.

---

## 📄 License

The individual projects may contain their own license files. Refer to each project directory for applicable license information.

---

**Developed by Alkaseem Malik | Datheon Full Stack Web Development Internship**