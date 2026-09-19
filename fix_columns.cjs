const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// fetchSurveys
code = code.replace(
  /select\('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,comment_count,view_count,is_official,created_at,deadline,user_id,user_name,source_published_at', \{ count: 'exact' \}\)/g,
  "select('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,is_official,created_at,deadline,source_published_at', { count: 'exact' })"
);

// private surveys
code = code.replace(
  /select\('id,title,category,visibility,created_at,deadline,is_official,total_votes,likes_count,view_count,comment_count'\)/g,
  "select('id,title,category,visibility,created_at,deadline,is_official,total_votes,likes_count')"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Fixed invalid columns!');
