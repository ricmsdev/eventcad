import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp up
    { duration: '30s', target: 50 }, // Stay at 50 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

// Token de teste (em produção, seria obtido via login)
let authToken = '';

export function setup() {
  // Tentar fazer login para obter token
  const loginResponse = http.post('http://localhost:3000/api/v1/auth/login', 
    JSON.stringify({
      email: 'admin@eventcad.com',
      password: 'admin123'
    }), 
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    return { token: body.access_token };
  }
  return { token: null };
}

export default function (data) {
  const headers = data.token ? {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  } : {};

  // Teste endpoints públicos
  check(http.get('http://localhost:3000/health'), {
    'health status 200': (r) => r.status === 200,
  });

  check(http.get('http://localhost:3000/docs'), {
    'docs status 200': (r) => r.status === 200,
  });

  check(http.get('http://localhost:80'), {
    'frontend status 200': (r) => r.status === 200,
    'frontend is React app': (r) => r.body.includes('EventCAD'),
  });

  // Teste endpoints protegidos (se tiver token)
  if (data.token) {
    check(http.get('http://localhost:3000/api/v1/eventos', { headers }), {
      'eventos status 200': (r) => r.status === 200,
    });

    check(http.get('http://localhost:3000/api/v1/plantas', { headers }), {
      'plantas status 200': (r) => r.status === 200,
    });

    check(http.get('http://localhost:3000/api/v1/infra-objects', { headers }), {
      'infra-objects status 200': (r) => r.status === 200,
    });

    check(http.get('http://localhost:3000/api/v1/ai-jobs', { headers }), {
      'ai-jobs status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}