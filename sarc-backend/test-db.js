const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        include: { faculty: true }
    });
    console.log("Projects in DB:", JSON.stringify(projects, null, 2));

    const ideas = await prisma.projectIdea.findMany({
        include: { faculty: true }
    });
    console.log("Ideas in DB:", JSON.stringify(ideas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
