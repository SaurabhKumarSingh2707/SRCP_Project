const fs = require('fs');
const txt = fs.readFileSync('c:\\Users\\saura\\OneDrive\\Desktop\\SRCP_Project\\GSP Lists - Students.csv', 'utf8');
console.log(txt.split('\n').find(l => l.includes('saurabhkumarsingh2707@gmail.com')));
