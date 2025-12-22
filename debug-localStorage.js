// Debug script to check localStorage content
// Run this in browser console: copy and paste this code

console.log('=== GRAFANA DASHBOARDS DEBUG ===');

const dashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
console.log('Total dashboards in localStorage:', dashboards.length);

dashboards.forEach((dashboard, index) => {
  console.log(`\n--- Dashboard ${index + 1} ---`);
  console.log('ID:', dashboard.id);
  console.log('Title:', dashboard.title);
  console.log('Panels count:', dashboard.panels?.length || 0);
  console.log('Panels:', dashboard.panels);
  console.log('Full dashboard:', dashboard);
});

// Clear all dashboards (uncomment to use)
// localStorage.removeItem('grafana-dashboards');
// console.log('Cleared all dashboards');