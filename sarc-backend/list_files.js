const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listFiles(bucketName, path = '') {
  const { data, error } = await supabase.storage.from(bucketName).list(path);
  if (error) {
    console.error(error);
    return;
  }
  
  for (const item of data) {
    console.log(`${path ? path + '/' : ''}${item.name} (is folder: ${!item.id})`);
    if (!item.id) {
       await listFiles(bucketName, `${path ? path + '/' : ''}${item.name}`);
    }
  }
}
listFiles('faculty_profile_photo');
