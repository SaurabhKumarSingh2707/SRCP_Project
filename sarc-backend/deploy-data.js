const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { bulkCreateUsers } = require('./controllers/userController');

const prisma = new PrismaClient();

async function run() {
    console.log("Connecting to database...");

    const csvPath = 'c:\\Users\\saura\\OneDrive\\Desktop\\SRCP_Project\\GSP Lists - Students.csv';
    console.log(`Reading CSV from ${csvPath}...`);
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const usersPayload = [];
    const allEmails = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] ? cols[idx].trim() : '';
        });

        if (!row['Email'] || !row['Name']) continue;

        allEmails.push(row['Email']);
        usersPayload.push({
            fullName: row['Name'],
            email: row['Email'],
            password: row['Password'] || row['DOB'] || 'password123',
            role: 'STUDENT',
            department: row['Department'] || 'CSE',
            batch: '2026',
            section: row['Section'] || '',
            studentId: row['Register Number'],
            dateOfBirth: row['DOB']
        });
    }

    console.log(`Parsed ${allEmails.length} emails from CSV.`);
    
    console.log("Deleting old corrupted data...");
    // Delete in chunks to avoid query limits
    const chunkSize = 200;
    for (let i = 0; i < allEmails.length; i += chunkSize) {
        const chunk = allEmails.slice(i, i + chunkSize);
        await prisma.user.deleteMany({
            where: { email: { in: chunk } }
        });
    }
    console.log("Old data deleted.");

    console.log(`Successfully parsed ${usersPayload.length} valid students from the CSV.`);

    // Mock the req/res objects and call the fixed bulkCreateUsers controller
    console.log("Inserting users into the database via bulk upload function...");
    const req = {
        user: { role: 'ADMIN' },
        body: { users: usersPayload }
    };

    let resolved = false;
    const res = {
        status: (code) => {
            return {
                json: (data) => {
                    console.log(`Controller responded with status ${code}`);
                    resolved = true;
                }
            };
        },
        json: (data) => {
            console.log(`Controller responded`);
            resolved = true;
        }
    };

    try {
        await bulkCreateUsers(req, res);
    } catch (err) {
        console.error("Error during bulk insert:", err);
    }

    await prisma.$disconnect();
    console.log("DONE");
}

run();
