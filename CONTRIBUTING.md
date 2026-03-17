# Contributing to LazyTrip

First off, thanks for taking the time to contribute! 🎉

We love exploring the domestic roads of Vietnam, and any help to make **LazyTrip** better is deeply appreciated. 

The following is a set of guidelines for contributing to LazyTrip. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/your-username/LazyTrip/issues) page first to see if someone else has already created a ticket. If not, go ahead and make one!

## Development Setup

The standard development environment relies on **Docker Compose** for seamless integration, or a manual dual-setup combining Vite React and FastAPI. Please read the `README.md` for explicit, step-by-step terminal commands.

## How Can I Contribute?

### Reporting Bugs
Bugs are tracked as GitHub issues. When creating an issue, please explain the problem and include additional details to help maintainers reproduce the problem:
1. **Clear title and description.**
2. **Steps to reproduce.**
3. **What you expected to happen vs what actually happened.**

### Proposing Enhancements
Enhancements can range from small UI tweaks (like adding an interactive animation) to completely new backend integrations (like hooking up Foursquare POIs alongside OpenWeatherMap). Provide a clear explanation of *why* the enhancement would be useful to the LazyTrip user base.

### Submitting a Pull Request
1. Fork the repo and create your branch from `main`.
2. Prefix your branch name (e.g., `feat/add-leaflet-routing`, `fix/weather-typo`, `docs/update-readme`).
3. If you've added code that should be tested, add tests.
4. Ensure the React frontend passes ESLint checks (`npm run lint`).
5. Ensure the Python backend follows PEP 8 conventions.
6. Issue that pull request!

## Code Style Guide

### Frontend (React)
- Use functional components and Hooks (e.g., `useState`, `useEffect`).
- Component names should be PascalCase (`LocationBox.jsx`).
- Use informative semantic HTML and vanilla CSS for styling to keep bundle sizing minimal, unless importing specific component libraries is necessary.

### Backend (Python)
- Format using standard conventions (consider using `black` or `flake8`).
- Maintain Type Hints (`list[Waypoint]`, `str`) for clearer logic flows.
- Ensure all external API calls strictly catch `httpx.HTTPStatusError` explicitly to prevent ungraceful crashes on the client.

---
By contributing to LazyTrip, you agree that your contributions will be licensed under its MIT License.
