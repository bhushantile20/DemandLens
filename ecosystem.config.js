module.exports = {
  apps: [
    {
      name: "demandlens-backend",
      cwd: "./backend",
      // On Linux, the virtual environment executable is in venv/bin
      script: "venv/bin/python",
      args: "manage.py runserver 0.0.0.0:8000",
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
