const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// fetchSurveys
code = code.replace(
  /select\('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,is_official,created_at,deadline,source_published_at', \{ count: 'exact' \}\)/g,
  "select('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,is_official,created_at,deadline,user_id,source_published_at', { count: 'exact' })"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Added user_id back!');
