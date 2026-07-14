const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://azvavauoqdtcgjtzsnot.supabase.co';
const supabaseKey = 'sb_secret_7jdc_fNL2gW50DaY-Zk1cA_8hVMVOao';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    try {
        fs.writeFileSync('test.txt', 'Hello World');
        const { data, error } = await supabase.storage.from('Upload_Files').upload('test/test.txt', fs.readFileSync('test.txt'), { upsert: true });
        console.log("Upload Data:", data);
        if (error) console.error("Upload Error:", error);
    } catch (e) {
        console.error("Exception:", e);
    }
}
testUpload();
