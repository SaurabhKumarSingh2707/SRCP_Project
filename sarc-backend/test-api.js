const http = require('http');

const loginData = JSON.stringify({ email: 'faculty@sathyabama.ac.in', password: 'password123' });

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(rawData);
        const token = parsed.token;
        console.log("Got token!", token?.substring(0, 10) + '...');

        // Now post idea
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const postData =
            `--${boundary}\r
Content-Disposition: form-data; name="title"\r
\r
Test API Idea\r
--${boundary}\r
Content-Disposition: form-data; name="description"\r
\r
Testing this from script\r
--${boundary}--\r\n`;

        const ideaReq = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/projects/ideas',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Authorization': `Bearer ${token}`
            }
        }, (res2) => {
            let resData = '';
            res2.on('data', (c) => resData += c);
            res2.on('end', () => {
                console.log("Idea Creation Status:", res2.statusCode);
                console.log("Idea Creation Body:", resData);
            });
        });

        ideaReq.on('error', console.error);
        ideaReq.write(postData);
        ideaReq.end();
    });
});

req.on('error', console.error);
req.write(loginData);
req.end();
