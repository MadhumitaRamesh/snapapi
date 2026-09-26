# SnapAPI

This is my SnapAPI project for my Functional Web Development subject. It lets you create fake API endpoints that return whatever JSON-looking text you want, so frontend developers don't have to wait for the real backend to be built. You just set a URL, type the response you want it to give, and pick a status code. Then you can call that URL from your frontend code to test if your app works.

### Tech Stack
- Frontend: React (Vite)
- Backend: Python (Flask)
- Database: SQLite (using plain sql queries)

### How to Run Locally

You need to run the frontend and backend in separate terminal windows.

For the backend:
1. Open a terminal and go into the `backend` folder.
2. Run `pip install flask flask-cors werkzeug` to get the dependencies.
3. Run `python app.py` to start the server. It will run on port 5001.

For the frontend:
1. Open another terminal and go into the `frontend` folder.
2. Run `npm install` to download the packages.
3. Run `npm run dev` to start the React app.

### Features
- **Landing Page**: A simple welcome screen with a banner.
- **Login / Register**: Basic user authentication to save your own endpoints.
- **Dashboard**: A list of all the mock endpoints you've created.
- **Create / Edit Endpoint**: A form to type in your fake JSON response and pick a status code.
- **API Tester**: A built-in page to test your URL and see the response time and raw output.
- **Docs**: A help page showing how to use curl or fetch to call your mock APIs.
- **Profile**: A page to change your password, update your name, download a text file of your endpoints, or delete your account.
- **Admin Panel**: A separate login for admins to view all users and delete endpoints if needed.

### Known Limitations
- The backend doesn't validate the JSON payload you type in, so if you type something broken it'll just be saved and returned as-is.
- There is no password reset email feature, if you forget your password you have to delete the account or ask an admin.
- The exported endpoints file is just a plain text file, not a JSON export you can re-import later.
- It only supports mocking simple responses, it doesn't handle dynamic query parameters or different HTTP methods doing different things.
