# Software_Engineering_Food_Delivery
A food delivery app for our SE class.

How to run (Win11)

What you need:
- Node.js

1. open cmd
2. go to "./app" folder
3. run "python -m pip install fastapi uvicorn bcrypt pydantic"
4. run "python -m uvicorn app:app --reload --port 8000"
5. open second cmd 
6. go to "./frontend"
7. run "npm install"
8. run "npm run dev"
9. open in a browser: "localhost:'#VITEport' "
10. pray that you don't crash the database while trying to get the backend up :)


What is missing, compared to our early documentation:
- payment process
- gold users
- privacy policy page
- contact us page
- delivery drivers