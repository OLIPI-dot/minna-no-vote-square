const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace fetchSurveys
code = code.replace(
  /select\('id,title,description,category,tags,visibility,image_url,youtube_id,likes_count,total_votes,is_official,created_at,deadline,user_id,source_published_at'/g,
  "select('id,title,description,category,tags,visibility,image_url,likes_count,total_votes,is_official,created_at,deadline,user_id,source_published_at,view_count,comment_count'"
);

// Replace adjacentSurveys (4 occurrences total in the file)
code = code.replace(
  /select\('id,title,category,tags,total_votes,image_url,youtube_id,created_at'/g,
  "select('id,title,category,tags,total_votes,image_url,created_at'"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Fixed youtube_id issue and restored view_count/comment_count!');
