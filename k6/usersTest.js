import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 101,
};

export default function () {
  const response = http.get('http://localhost:4000/api/users');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response has users': (r) =>
      r.status === 200 &&
      r.body &&
      r.body.includes('"users"'),
  });
}