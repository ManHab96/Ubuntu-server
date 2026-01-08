module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/home/ubuntu/agencia-automotriz/backend',
      script: '/home/ubuntu/agencia-automotriz/backend/venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      interpreter: 'none',
      env: {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'automotive_agency',
        PYTHONUNBUFFERED: '1'
      }
    },
    {
      name: 'frontend',
      cwd: '/home/ubuntu/agencia-automotriz/frontend',
      script: 'node_modules/.bin/serve',
      args: '-s build -l 3000',
      interpreter: 'none'
    }
  ]
};
