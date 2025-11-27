require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) {
    console.log("DATABASE_URL is undefined or empty");
} else {
    console.log("DATABASE_URL length:", url.length);
    console.log("Starts with postgresql://?", url.startsWith('postgresql://'));
    console.log("Starts with postgres://?", url.startsWith('postgres://'));
    console.log("First 10 chars:", url.substring(0, 10));
}
