const survey = {
    "id": 1494,
    "created_at": "2026-03-17T03:28:14.27952+00:00",
    "title": "ボディビルダーカツヒコ氏、akikoさんをナンパする⚖️💪",
    "deadline": "2026-03-31T03:28:17.451+00:00",
    "category": "エンタメ",
    "is_official": false
};

const sort = 'today';
const categoryFilter = 'ニュース';
const currentTab = 'official';
const query = '';

function testFilters() {
    console.log("Testing survey:", survey.title);
    
    // Date filter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const createdAt = new Date(survey.created_at);
    const datePass = createdAt >= todayStart;
    console.log(`Date Filter (gte ${todayStart.toISOString()}): ${datePass ? 'PASS' : 'FAIL'} (Survey date: ${createdAt.toISOString()})`);

    // Category filter
    const catPass = (categoryFilter === 'すべて' || survey.category === categoryFilter);
    console.log(`Category Filter (eq ${categoryFilter}): ${catPass ? 'PASS' : 'FAIL'}`);

    // Tab filter
    let isOfficial = survey.is_official;
    // Legacy logic
    const isLegacy = new Date(survey.created_at) < new Date('2026-03-19T00:00:00Z');
    if (!isOfficial && isLegacy) {
        const hasOfficialTag = false; // Simplified
        const hasOfficialTitle = /^(【.*?】|「.*?」)/.test(survey.title);
        if (hasOfficialTag || hasOfficialTitle) isOfficial = true;
    }
    const tabPass = (currentTab === 'official' ? isOfficial : !isOfficial);
    console.log(`Tab Filter (Official): ${tabPass ? 'PASS' : 'FAIL'} (Final isOfficial: ${isOfficial})`);
}

testFilters();
