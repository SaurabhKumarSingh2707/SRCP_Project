const fs = require('fs');
const transcriptPath = 'c:\\\\Users\\\\saura\\\\.gemini\\\\antigravity-ide\\\\brain\\\\d670f8cb-0531-4bb4-a86d-bd65d49f10c0\\\\.system_generated\\\\logs\\\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');

for (const line of lines) {
    if (!line) continue;
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('Total Lines: 637')) {
        const content = obj.content;
        const startIndex = content.indexOf('1: ');
        const endIndex = content.indexOf('The above content shows the entire, complete file contents');
        let actualCode = content.substring(startIndex, endIndex).split('\n').map(l => l.replace(/^\d+: /, '')).join('\n');
        actualCode = actualCode.trim(); // clean up trailing newlines
        fs.writeFileSync('src/pages/shared/TeamDetails.jsx', actualCode);
        console.log('Recovered successfully!');
        break;
    }
}
