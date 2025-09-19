# Frontend setup

Environment variables (create `.env` in this folder):

```
VITE_API_BASE=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/dashboard/
```

Scripts:

```
npm run dev
npm run build
npm run preview
```

Login with a user from the backend. Admin role sees the Admin Dashboard (routes under `/admin`), Sailor role sees profile and feedback routes (`/sailor`, `/sailor/feedback`).

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
