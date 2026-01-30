const { exec } = require('child_process');

exec('git add . && git commit -m "fix: repair restaurants data and apply all updates" && git push', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
