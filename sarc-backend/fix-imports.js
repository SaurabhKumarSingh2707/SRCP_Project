const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk('.');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("const { prisma } = require('../config/prismaClient');") || content.includes("const { prisma } = require('./config/prismaClient');")) {
        content = content.replace(/const prisma = require\(['"]\.\.\/config\/prismaClient['"]\);?/g, "const { prisma } = require('../config/prismaClient');");
        content = content.replace(/const prisma = require\(['"]\.\/config\/prismaClient['"]\);?/g, "const { prisma } = require('./config/prismaClient');");
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});

console.log(`Updated ${count} files.`);
