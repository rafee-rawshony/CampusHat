const fs = require('fs');
const file = 'frontend/src/components/admin/ReviewCenter/VerificationReviewTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// The issue is an unclosed div.
// Original target to find:
//                                     </Button>
//                                 </div>
//                             </div>
//                         </ReviewItemCard>
//
// We want to replace it with:
//                                     </Button>
//                                 </div>
//                                 </div>
//                             </div>
//                         </ReviewItemCard>

content = content.replace(
    /                                    <\/Button>\r?\n                                <\/div>\r?\n                            <\/div>\r?\n                        <\/ReviewItemCard>/,
    `                                    </Button>
                                </div>
                                </div>
                            </div>
                        </ReviewItemCard>`
);

fs.writeFileSync(file, content);
console.log('Fixed div');
