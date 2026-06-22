const fs = require('fs');
const path = require('path');

const dir = './controllers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace parseInt(var) with just var for known ID variables
    const idVars = [
        'req.params.id', 'req.params.projectId', 'id', 'projectId', 'teamId', 
        'userId', 'facultyId', 'studentId', 'milestoneId', 'applicationId', 'ideaId'
    ];
    
    idVars.forEach(v => {
        const regex = new RegExp(`parseInt\\(${v.replace(/\./g, '\\.')}\\)`, 'g');
        content = content.replace(regex, v);
    });

    // Also handle ids.map(id => parseInt(id))
    content = content.replace(/ids\.map\(id => parseInt\(id\)\)/g, 'ids');

    fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done replacing parseInt for IDs.');
