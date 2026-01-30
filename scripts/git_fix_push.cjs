const { exec } = require('child_process');

exec('git add . && git commit -m "fix: restore MAIN_VIDEO_LINK export and update Bask Bear (ID 298) image" && git push', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
