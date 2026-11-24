CEBU FARE GUIDE - START HERE

1. Extract the entire ZIP file to a normal folder (for example C:\Projects\CebuFareGuide).
2. Make sure Node.js is installed.
3. Double-click START_DEV.bat.
4. The script installs/checks dependencies and then starts the Vite development server.
5. Open the Local URL shown in the command window (normally http://localhost:5173/).

Do not open index.html directly. The app must run through the Vite development server.

If Windows displays an Application Control policy block for a .node file, this is a Windows security policy restriction. The batch file cannot override it. Save the error message and ask the device administrator to review/allow the legitimate dependency, or run the project on a device where the policy permits it. Do not disable security controls.

For a manual start, open Command Prompt in this folder and run:
  npm install
  npm run dev
