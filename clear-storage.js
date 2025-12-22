// Run this in browser console to clear old dashboards and start fresh
console.log('Clearing old dashboards...');
localStorage.removeItem('grafana-dashboards');
console.log('localStorage cleared. Create a new dashboard to test.');

// Or to see what's currently saved:
// const dashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
// console.log('Current dashboards:', dashboards);