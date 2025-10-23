# Personal Recipe Database App

A full-stack recipe management application with a React frontend, Django REST API backend, and PostgreSQL database, all containerized with Docker.

## Features

- Two-pane layout: recipe list and detailed view
- Add new recipes with a Material Design 3 modal
- Recipe fields: name, description, prep time, cook time, difficulty, and dynamic ingredient list
- Delete recipes
- Material Design 3 UI components from Material-UI v6

## Tech Stack

- **Frontend**: React 18 with Material-UI v6 (Material Design 3)
- **Backend**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL 15
- **Containerization**: Docker and Docker Compose

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Start all services:
```bash
docker-compose up --build
```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/recipes/
   - Django Admin: http://localhost:8000/admin/

3. To stop the application:
```bash
docker-compose down
```

### Creating a Django Admin User (Optional)

To access the Django admin panel:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts to create your admin account.

## Project Structure

```
.
├── backend/
│   ├── recipe_project/       # Django project settings
│   ├── recipes/              # Recipes app
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## API Endpoints

- `GET /api/recipes/` - List all recipes
- `POST /api/recipes/` - Create a new recipe
- `GET /api/recipes/{id}/` - Get a specific recipe
- `PUT /api/recipes/{id}/` - Update a recipe
- `DELETE /api/recipes/{id}/` - Delete a recipe

## Development

The application uses volume mounting for hot-reloading during development:
- Frontend changes will automatically reload
- Backend changes will automatically reload the Django development server
