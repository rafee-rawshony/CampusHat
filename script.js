const fs = require('fs');
const path = require('path');

const files = [
    'admin/users/page.tsx',
    'admin/page.tsx',
    'admin/orders/page.tsx',
    'admin/mall-products/page.tsx',
    'admin/categories/page.tsx',
    'admin/campuses/page.tsx',
    'admin/activity/page.tsx'
];

files.forEach(f => {
    let p = path.join('C:/Parsonal Website/CampusHat/frontend/src/app', f);
    let content = fs.readFileSync(p, 'utf8');

    // Check if guard is already there
    if (content.includes("router.replace('/admin/approvals')")) {
        console.log('Skipping', f, '(already guarded)');
        return;
    }

    if (!content.includes("import { useRouter }")) {
        content = content.replace(/(im\w*port\s+.*)/, "import { useRouter } from 'next/navigation'\n");
    }
    if (!content.includes("useAuthStore")) {
        content = content.replace(/(im\w*port\s+.*)/, "import { useAuthStore } from '@/stores/auth.store'\n");
    }
    if (!content.includes("useEffect")) {
        if (content.includes("import React, { useState }")) {
           content = content.replace("import React, { useState }", "import React, { useState, useEffect }");
        } else if (content.includes("import React ")) {
           content = content.replace("import React ", "import React, { useEffect } ");
        } else if (content.includes("import { useState }")) {
           content = content.replace("import { useState }", "import { useState, useEffect }");
        } else {
           content = content.replace(/(im\w*port\s+.*)/, "import { useEffect } from 'react'\n");
        }
    }

    content = content.replace(
        /(export default function \w+\(.*\) \{)/,
        "$1\n    const { isAdmin } = useAuthStore()\n    const router = useRouter()\n\n    useEffect(() => {\n        if (!isAdmin()) {\n            router.replace('/admin/approvals')\n        }\n    }, [])\n"
    );

    fs.writeFileSync(p, content);
    console.log('Processed', f);
});
