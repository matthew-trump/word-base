# User Alpha

The purpose of this app is to develop the scaffolding of secure user logins and sessions for web apps.

We will build a monorepo full stack CORS app with the following characteristics:

1. The front end will use html, css, and plain vanilla javascript. It will be a single page app with routes. The app will be served out of

The app will have a top navigation bar with the name of the web application, which is a link to the home page across all routes. 

There will also be a link to the front end route /test. On this page will be a button labeled "test". 

2. The back end will use FastAPI. Make a Python virtual environment using python3 and module venv in the direction env/. Source it before all python commands henceforth. Use the pip command in this environment to install requirements as we proceed, and use it as well to run the app. Make and maintain a proper requirements.txt in the root directory of the backend.


The FastAPI app should run on PORT 8026 on localhost.  It will define an API with a single backend route:

GET /test. This will return JSON with the payload {"message": "OK"}

Pressing the button will result in an API call to the backend /test route. If the pressing the button returns a 200 response, then a transient message should be displayed below the button say "test was sucessful". If it results in an error it should display an error message which is the returned "error" field in the JSON, e.g. {"error", "test failed"}

The backend will use a Sqlite3 database the file for which will exist in the local root directory.


Create a git repository in the root. Create a proper README.md in the root. Make a proper .gitignore file in the root. Make an environment file called .env in the root. DO NOT add .env to the repository but add it to .gitgnore. DO, however, create .env-exmaple file to provide examples of all environment variables added to the repo.

Provide for the loading of environment variables by the Python app.




