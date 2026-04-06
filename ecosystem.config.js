module.exports = {
  apps: [
    {
      name: "demandlens-backend",
      cwd: "./backend",
      // If you are using a virtual environment, replace "python" with the path to your venv python executable
      // e.g., "venv/Scripts/python" or "env/Scripts/python"
      script: "venv/Scripts/python.exe",
      args: "-m waitress --host=0.0.0.0 --port=8000 config.wsgi:application",
      watch: false,
      env: {
        "DJANGO_SETTINGS_MODULE": "config.settings",
        // Add any other backend environment variables here
      }
    },
    {
      name: "demandlens-frontend",
      cwd: "./frontend",
      script: "npm",
      // Using preview for production-like build, or replace with "run dev" for development auto-reloading
      args: "run preview -- --host 0.0.0.0 --port 5173", 
      watch: false,
      env: {
        // Add any frontend environment variables here
      }
    }
  ]
};
