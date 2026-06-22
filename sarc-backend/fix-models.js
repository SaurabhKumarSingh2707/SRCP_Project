const fs = require('fs');
const path = require('path');

const dir = './controllers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/guideTeamMember/g, 'teamMember');
    content = content.replace(/GuideTeamMember/g, 'TeamMember');
    content = content.replace(/guideTeam/g, 'team');
    content = content.replace(/GuideTeam/g, 'Team');
    content = content.replace(/guideStatus/g, 'status');
    
    fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Replaced GuideTeam references.');
