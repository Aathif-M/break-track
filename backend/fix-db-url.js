const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DATABASE_URL=(.*)/);
    if (match) {
        let url = match[1].trim();
        // Remove quotes if present
        if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
            url = url.slice(1, -1);
        }

        if (url.includes('localhost')) {
            const newUrl = url.replace('localhost', '127.0.0.1');
            console.log(newUrl);
        } else {
            console.log(url);
        }
    } else {
        console.error("DATABASE_URL not found in .env");
    }
} else {
    console.error(".env file not found");
}
