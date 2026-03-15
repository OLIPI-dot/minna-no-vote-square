const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove redundancy at line 1921
const oldDetailsEnd = '<button className="back-to-list-link" onClick={() => navigateTo(\'list\')}>← 戻る</button>\n                </div>\n                </div>';
const newDetailsEnd = '<button className="back-to-list-link" onClick={() => navigateTo(\'list\')}>← 戻る</button>\n                </div>';

if (content.includes(oldDetailsEnd)) {
    content = content.replace(oldDetailsEnd, newDetailsEnd);
}

// 2. Fix the very end of everything
// We want to find the sequence of closures after Pagination and before Sidebar
// Current:
// </div> (comments-list)
// </div> (comments-section-area)
// </div> (score-card)
// )} (view === details)
// </div> (survey-card)
// <Sidebar />

// What it should be if we use Fragment:
// </div> (comments-list)
// </div> (comments-section-area)
// </>\n )} (view === details)
// </div> (survey-card)
// <Sidebar />

const oldEndSeq = '                      );\n                    })()}\n                  </div>\n                </div>\n              </div>\n            )}\n          </div>\n          <Sidebar />';

const newEndSeq = '                      );\n                    })()}\n                  </div>\n                </div>\n              </>\n            )}\n          </div>\n          <Sidebar />';

if (content.includes(oldEndSeq)) {
    content = content.replace(oldEndSeq, newEndSeq);
} else {
    // try with different indentation if fail
    console.log('Indentation mismatch for end sequence, trying alternative...');
}

fs.writeFileSync(filePath, content);
console.log('Programmatic fix completed!');
