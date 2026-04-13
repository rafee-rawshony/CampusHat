const fs = require('fs');
const path = require('path');

const directory = 'src';

const pattern1 = /\.then\(r => r\.data\?\.data\?\.results \|\| r\.data\?\.results \|\| r\.data\?\.data \|\| r\.data \|\| \[\]\)/g;
const replacement1 = `.then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] })`;

const pattern2 = /\.then\(r => r\.data\?\.results \|\| r\.data\?\.data \|\| r\.data \|\| \[\]\)/g;
const replacement2 = `.then(r => { const res = r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] })`;

function fixIndex(content) {
    let c = content;
    c = c.replace(/const d = r\.data\?\.data \?\? r\.data\s+setHeroProducts\(d \|\| \[\]\)/g, "const d = r.data?.data ?? r.data\n        setHeroProducts(Array.isArray(d) ? d : [])");
    c = c.replace(/const d = r\.data\?\.data \?\? r\.data\s+setCategories\(d \|\| \[\]\)/g, "const d = r.data?.data ?? r.data\n        setCategories(Array.isArray(d) ? d : [])");
    c = c.replace(/const d = r\.data\?\.data \?\? r\.data\s+setMarketplace\(d \|\| \[\]\)/g, "const d = r.data?.data ?? r.data\n        setMarketplace(Array.isArray(d) ? d : [])");
    c = c.replace(/const d = r\.data\?\.data \?\? r\.data\s+setStores\(d \|\| \[\]\)/g, "const d = r.data?.data ?? r.data\n        setStores(Array.isArray(d) ? d : [])");
    return c;
}

function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

const files = walkSync(directory);
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    
    content = content.replace(pattern1, replacement1);
    content = content.replace(pattern2, replacement2);
    content = fixIndex(content);
    
    if (orig !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    }
}
console.log('Done');
