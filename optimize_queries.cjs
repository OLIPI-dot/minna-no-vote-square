const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. loadFromUrl cache check
const loadFromUrlTarget = `      if (!surveyId || surveyId === 'null' || surveyId === 'undefined') {
        console.log("🏘️ loadFromUrl: Resetting to list view.");`;
const loadFromUrlReplacement = `      if (currentSurvey && String(currentSurvey.id) === String(surveyId)) {
        console.log("⚡ loadFromUrl: Already viewing this survey, skipping fetch");
        return;
      }

      if (!surveyId || surveyId === 'null' || surveyId === 'undefined') {
        console.log("🏘️ loadFromUrl: Resetting to list view.");`;
code = code.replace(loadFromUrlTarget, loadFromUrlReplacement);

// 2. fetchSurveys optimization
const fetchSurveysTarget = `let baseQuery = supabase.from('surveys').select('*', { count: 'exact' });`;
const fetchSurveysReplacement = `let baseQuery = supabase.from('surveys').select('id, title, category, tags, visibility, image_url, youtube_id, likes_count, total_votes, is_official, created_at, deadline, source_published_at', { count: 'exact' });`;
code = code.replace(fetchSurveysTarget, fetchSurveysReplacement);

// 3. handleViewSurvey duplicated loadAdjacentSurveys optimization (1002-1003)
code = code.replace(
  `supabase.from('surveys').select('*').eq('visibility', 'public').lt('created_at', sv.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),`,
  `supabase.from('surveys').select('id, title, category, image_url, youtube_id, created_at').eq('visibility', 'public').lt('created_at', sv.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),`
);
code = code.replace(
  `supabase.from('surveys').select('*').eq('visibility', 'public').gt('created_at', sv.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()`,
  `supabase.from('surveys').select('id, title, category, image_url, youtube_id, created_at').eq('visibility', 'public').gt('created_at', sv.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()`
);

// 4. handleViewSurvey duplicated loadAdjacentSurveys optimization (1454-1455)
code = code.replace(
  `supabase.from('surveys').select('*').eq('visibility', 'public').lt('created_at', survey.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),`,
  `supabase.from('surveys').select('id, title, category, image_url, youtube_id, created_at').eq('visibility', 'public').lt('created_at', survey.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),`
);
code = code.replace(
  `supabase.from('surveys').select('*').eq('visibility', 'public').gt('created_at', survey.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()`,
  `supabase.from('surveys').select('id, title, category, image_url, youtube_id, created_at').eq('visibility', 'public').gt('created_at', survey.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()`
);

// 5. fetchSurveys private optimization
code = code.replace(
  `let mQuery = supabase.from('surveys').select('*').neq('visibility', 'public');`,
  `let mQuery = supabase.from('surveys').select('id, title, category, visibility, created_at, deadline, is_official').neq('visibility', 'public');`
);

// 6. fetchSurveys sidebar count optimization
code = code.replace(
  `let q = supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('visibility', 'public').eq('is_official', isOff);`,
  `let q = supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('visibility', 'public').eq('is_official', isOff);`
);

// 7. Remove unused variables for ESLint
code = code.replace(`} catch (err) {`, `} catch {`); // Remove unused catch err
code = code.replace(`const { error } = await supabase.from('surveys').delete().eq('id', surveyId);`, `await supabase.from('surveys').delete().eq('id', surveyId);`);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Queries optimized successfully');
