const fs = require('fs');
const pages = [
  'Dashboard',
  'ProjectManagement',
  'GanttChart',
  'MilestoneManagement',
  'TaskManagement',
  'TeamManagement',
  'DPR',
  'BudgetManagement',
  'DocumentManagement',
  'EmailNotification'
];

pages.forEach(page => {
  fs.writeFileSync(`d:/CRM Digitalization/client/src/pages/${page}.tsx`, `export default function ${page}() { return <div>${page} Screen</div>; }`);
});
