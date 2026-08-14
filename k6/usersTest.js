import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s',
};

export default function () {
  const response = http.get('http://localhost:3000/api/users');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response has users': (r) => r.body.includes('"users"'),
  });
}