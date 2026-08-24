import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const status200 = new Counter('status_200');
const status429 = new Counter('status_429');
const otherStatus = new Counter('other_status');

export const options = {
  vus: 20,
  iterations: 100,
};

export default function () {
  const response = http.get('http://localhost:5000/api/slow');

  if (response.status === 200) {
    status200.add(1);
  } else if (response.status === 429) {
    status429.add(1);
  } else {
    otherStatus.add(1);

    console.log(`UNEXPECTED STATUS: ${response.status}`);
    console.log(`RESPONSE BODY: ${response.body}`);
  }

  check(response, {
    'status is 200 or 429': (r) =>
      r.status === 200 || r.status === 429,

    'rate limit response is correct': (r) =>
      r.status !== 429 || r.body.includes('Too many requests'),
  });
}