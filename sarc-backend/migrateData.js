const { PrismaClient } = require('@prisma/client');

async function migrateData() {
    console.log("Initializing database connections...");
    const source = new PrismaClient({ datasources: { db: { url: "postgresql://postgres.azvavauoqdtcgjtzsnot:Guideselection%402026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" } } });
    const dest = new PrismaClient({ datasources: { db: { url: "postgresql://postgres.docylrbacdtzjrygrjvk:Sarcgpoartl%40123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true" } } });

    try {
        console.log("Connected to databases. Testing connection...");
        const sourceUsers = await source.user.count();
        console.log("Source users count:", sourceUsers);
        
        console.log("Wiping destination database to prevent conflicts...");
        // Delete in order to prevent foreign key errors (though Cascade delete might handle it)
        await dest.session.deleteMany();
        await dest.notification.deleteMany();
        await dest.facultyGuideSlot.deleteMany();
        await dest.facultyProfile.deleteMany();
        await dest.industryProfile.deleteMany();
        await dest.adminProfile.deleteMany();
        await dest.teamMember.deleteMany();
        await dest.milestone.deleteMany();
        await dest.team.deleteMany();
        await dest.projectIdea.deleteMany();
        await dest.project.deleteMany();
        await dest.user.deleteMany();
        console.log("Target database cleared successfully.");

        console.log("Migrating Users...");
        const users = await source.user.findMany();
        if (users.length > 0) await dest.user.createMany({ data: users });

        console.log("Migrating FacultyProfiles...");
        const facultyProfiles = await source.facultyProfile.findMany();
        if (facultyProfiles.length > 0) await dest.facultyProfile.createMany({ data: facultyProfiles });

        console.log("Migrating IndustryProfiles...");
        const industryProfiles = await source.industryProfile.findMany();
        if (industryProfiles.length > 0) await dest.industryProfile.createMany({ data: industryProfiles });

        console.log("Migrating AdminProfiles...");
        const adminProfiles = await source.adminProfile.findMany();
        if (adminProfiles.length > 0) await dest.adminProfile.createMany({ data: adminProfiles });

        console.log("Migrating FacultyGuideSlots...");
        const slots = await source.facultyGuideSlot.findMany();
        if (slots.length > 0) await dest.facultyGuideSlot.createMany({ data: slots });

        console.log("Migration completed successfully!");

    } catch(e) {
        console.error("Migration failed:", e);
    } finally {
        await source.$disconnect();
        await dest.$disconnect();
    }
}
migrateData();
