const User = require.main.require('./src/user');
const Groups = require.main.require('./src/groups');
const moment = require('moment');

const ADMIN_UIDS = [1]; // ניתן להגדיר כאן את מזהה המשתמש שיוכל לצפות בצ'אטים של אחרים
const ALLOW_CHAT_GROUP = 'allowChat'; // ניתן להגדיר כאן את שם הקבוצה שיהיו מותרים להשתמש בצ'אט בלי תנאים
const DENY_CHAT_GROUP = 'denyChat'; // ניתן להגדיר כאן את שם הקבוצה שיהיו אסורים להשתמש בצ'אט בלי תנאים
const MIN_REPUTATION = 10; // ניתן להגדיר כאן את המוניטין שצריך לצבור כדי להשתשמש בצא'ט
const MIN_POSTS = 5; // ניתן להגדיר כאן את כמות הפוסטים שצריך לצבור כדי להשתשמש בצא'ט
const CHAT_NOT_YET_ALLOWED_MESSAGE = 'CHAT_NOT_YET_ALLOWED_MESSAGE'; // כאן ניתן להגדיר את ההודעה שמשתמש שעוד לא צבר מספיק וותק יקבל אם ינסה לפתוח צ'אט
const CHAT_DENIED_MESSAGE = 'CHAT_DENIED_MESSAGE'; // כאן ניתן להגדיר את ההודעה שמשתמש חסום יקבל אם ינסה לפתוח צ'אט

module.exports = {
  async canGetMessages (data) {
    data.canGet = true;
    const userData = await User.getUserData(data.callerUid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.callerUid]);
    if (
      (userData.reputation < MIN_REPUTATION || userData.postcount < MIN_POSTS || moment(userData.joindate).isAfter(moment() /* .subtract(1, 'month') */)) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        ALLOW_CHAT_GROUP
      ].includes(group.name))
    ) {
      throw new Error(CHAT_NOT_YET_ALLOWED_MESSAGE);
    }
    if (userGroups[0].find(group => group.name === DENY_CHAT_GROUP)) {
      throw new Error(CHAT_DENIED_MESSAGE);
    }
    if (data.callerUid !== data.uid && !ADMIN_UIDS.includes(data.callerUid)) throw new Error('אין גישה!');
    return data;
  },
  canReply = async data => data,
  async canMessageUser (data) {
    const userData = await User.getUserData(data.uid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.uid]);
    if (
      (userData.reputation < MIN_REPUTATION || userData.postcount < MIN_POSTS || moment(userData.joindate).isAfter(moment() /* .subtract(1, 'month') */)) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        ALLOW_CHAT_GROUP
      ].includes(group.name))
    ) {
      throw new Error(CHAT_NOT_YET_ALLOWED_MESSAGE);
    }
    if (userGroups[0].find(group => group.name === DENY_CHAT_GROUP)) {
      throw new Error(CHAT_DENIED_MESSAGE);
    }
  },
  async canMessageRoom () {},
  async isUserInRoom (data) {
    data.inRoom = ADMIN_UIDS.includes(data.uid);
    return data;
  }
};
