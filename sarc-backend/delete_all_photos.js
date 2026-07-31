const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function deleteAll(bucketName, path = '') {
  let allFiles = [];
  
  // List files with pagination
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: limit,
      offset: offset
    });
    
    if (error) {
      console.error('Error listing:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue;
      
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (!item.id) {
        // It's a folder, recurse
        await deleteAll(bucketName, fullPath);
      } else {
        allFiles.push(fullPath);
      }
    }
    
    if (data.length < limit) {
      break;
    }
    offset += limit;
  }
  
  if (allFiles.length > 0) {
    console.log(`Deleting ${allFiles.length} files in ${path || 'root'}...`);
    // Delete in batches of 100
    for (let i = 0; i < allFiles.length; i += 100) {
      const batch = allFiles.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucketName).remove(batch);
      if (error) {
        console.error('Error deleting batch:', error);
      } else {
        console.log(`Deleted ${batch.length} files.`);
      }
    }
  }
}

deleteAll('faculty_profile_photo').then(() => console.log('Done deleting photos.'));
