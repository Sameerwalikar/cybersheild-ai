import { shannonEntropy, entropyLevel } from './src/services/threat-intelligence/lexical/entropy.js';
const tests = ['asjd89as81', 'google', 'paytm', 'securepaytmlogin', 'xnpaytm', 'asjd8q91z'];
for (const t of tests) {
  const v = shannonEntropy(t);
  console.log(`${t} -> entropy=${v} level=${entropyLevel(v)}`);
}
