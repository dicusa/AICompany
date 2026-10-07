const os = require('node:os');
const original = os.userInfo;
os.userInfo = () => { try { return original(); } catch { return { username: 'test', uid: -1, gid: -1, shell: '', homedir: process.cwd() }; } };
