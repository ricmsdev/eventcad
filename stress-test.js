import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50, // 50 usuários simultâneos
  duration: '30s', // durante 30 segundos
};

export default function () {
  check(http.get('http://localhost:3000/health'), {
    'health status 200': (r) => r.status === 200,
  });
  check(http.get('http://localhost:3000/docs'), {
    'docs status 200': (r) => r.status === 200,
  });
  check(http.get('http://localhost:3000/api/v1/eventos'), {
    'eventos status 200': (r) => r.status === 200,
  });
  check(http.get('http://localhost:3000/api/v1/plantas'), {
    'plantas status 200': (r) => r.status === 200,
  });
  check(http.get('http://localhost:3000/api/v1/infra-objects'), {
    'infra-objects status 200': (r) => r.status === 200,
  });
  sleep(1);
}