# Nutrify AI: Agile Methods for Software Development Project

A React application with Firebase authentication, built with TypeScript and Vite.

This app allows users to take pictures of their plate of food to recieve an estimation of the calories and macro-nutrient profile for said meal. The output is then saved to the users profile so they can refer back to their previous meals, where they then recieve feedback based on the goal they have set in their profile. After users log their first meal, they begin to recieve meal recommendations based on both what they've entered into the app and their dietary goals.

We completed this project using Scrum, a widely used Agile methodology. Progress was divided into sprints, with backlogs of tasks representing correlating with each of our three sprints. To ensure we made steady progression, we met at least once per sprint to assess the state of the application and discuss how we'd like to change our approach.

## Features

- Firebase Authentication (Sign Up, Sign In, Sign Out)
- Modern UI with Chakra UI components
- Dark/Light mode support
- Responsive design
- Fast development with Vite
- Type-safe with TypeScript
- React Router for navigation

This app showcases a responsive Chakra UI layout with protected routes powered by Firebase Authentication. It’s a clean baseline for teams to iterate quickly on real-world features.

# App Setup Instructions

## Install Dependencies

Install all dependencies for our app:

```bash
npm install
```

## Create/Set Environment File

In the the application's directory, create an environment file named `.env.local` and insert the corresponding firebase information to connect to your database:

```env
VITE_FIREBASE_API_KEY=________________________
VITE_FIREBASE_AUTH_DOMAIN=________________________
VITE_FIREBASE_PROJECT_ID=________________________
VITE_FIREBASE_STORAGE_BUCKET=________________________
VITE_FIREBASE_MESSAGING_SENDER_ID=________________________
VITE_FIREBASE_APP_ID=________________________

```

## Run the App

To run our app itself, run:

```bash
npm run dev
```

## Connect the FastAPI Server

Here is a quick step-by-step process to connect the model to test our application.

### 1. Create/Set Environment variable

In the `FoodAIModel` folder, create an environment file named `.env` and insert your gemini API key:

```env
GEMINI_API_KEY=________________________
```

### 2. Create & Activate a Python Virtual Environment

Go into the `FoodAIModel` directory:

```bash
# go into the FoodAIModel Directory
cd .\FoodAIModel
```

Create the virtual environment:

```bash
# Create venv
python -m venv venv
```

Activate the virtual environment:

```bash
# Activate venv (Windows)
venv\Scripts\ctivate
```

```bash
# Activate venv (Mac/Linux)
source venv/bin/activate
```

### 3. Install Dependencies

Install the required packages:

```bash
# Install required packages
pip install -r requirements.txt
```

### 4. Start the FastAPI Server

Run the development server:

```bash
# Run development server
uvicorn app:app --reload --port 8000
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options..
    },
  },
]);
```
