/**

*Copyright 2017 TMBot
 
*Modifications (including forks) of the code to fit personal needs are allowed only for personal use and should refer back to the original source.
*This software is not for profit, any extension, or unauthorised person providing this software is not authorised to be in a position of any monetary gain from this use of this software. Any and all money gained under the use of the software (which includes donations) must be passed on to the original author.
 
*/

(function() {

    /*window.onerror = function() {
        var room = JSON.parse(localStorage.getItem('TMBotRoom'));
        window.location = 'https://plug.dj' + room.name;
    };*/

    API.getWaitListPosition = function(id) {
        if (typeof id === 'undefined' || id === null) {
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for (var i = 0; i < wl.length; i++) {
            if (wl[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    var kill = function() {
        clearInterval(TMBot.room.autodisableInterval);
        clearInterval(TMBot.room.afkInterval);
        TMBot.status = false;
    };

    // This socket server is used solely for statistical and troubleshooting purposes.
    // This server may not always be up, but will be used to get live data at any given time.

    /*
    var socket = function() {
        function loadSocket() {
            SockJS.prototype.msg = function(a) {
                this.send(JSON.stringify(a))
            };
            sock = new SockJS('https://benzi.io:4964/socket');
            sock.onopen = function() {
                console.log('Connected to socket!');
                sendToSocket();
            };
            sock.onclose = function() {
                console.log('Disconnected from socket, reconnecting every minute ..');
                var reconnect = setTimeout(function() {
                    loadSocket()
                }, 60 * 1000);
            };
            sock.onmessage = function(broadcast) {
                var rawBroadcast = broadcast.data;
                var broadcastMessage = rawBroadcast.replace(/["\\]+/g, '');
                API.chatLog(broadcastMessage);
                console.log(broadcastMessage);
            };
        }
        if (typeof SockJS == 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js', loadSocket);
        } else loadSocket();
    }

    var sendToSocket = function() {
        var TMBotSettings = TMBot.settings;
        var TMBotRoom = TMBot.room;
        var TMBotInfo = {
            time: Date.now(),
            version: TMBot.version
        };
        var data = {
            users: API.getUsers(),
            userinfo: API.getUser(),
            room: location.pathname,
            TMBotSettings: TMBotSettings,
            TMBotRoom: TMBotRoom,
            TMBotInfo: TMBotInfo
        };
        return sock.msg(data);
    };
    */

    var storeToStorage = function() {
        localStorage.setItem('TMBotsettings', JSON.stringify(TMBot.settings));
        localStorage.setItem('TMBotRoom', JSON.stringify(TMBot.room));
        var TMBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: TMBot.version
        };
        localStorage.setItem('TMBotStorageInfo', JSON.stringify(TMBotStorageInfo));
    };

    var subChat = function(chat, obj) {
        if (typeof chat === 'undefined') {
            API.chatLog('There is a chat text missing.');
            console.log('There is a chat text missing.');
            return '[Error] No text message found.';

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function(cb) {
        if (!cb) cb = function() {};
        $.get('https://rawgit.com/TitanMusicDev/titanmusic/master/langIndex.json', function(json) {
            var link = TMBot.chatLink;
            if (json !== null && typeof json !== 'undefined') {
                langIndex = json;
                link = langIndex[TMBot.settings.language.toLowerCase()];
                if (TMBot.settings.chatLink !== TMBot.chatLink) {
                    link = TMBot.settings.chatLink;
                } else {
                    if (typeof link === 'undefined') {
                        link = TMBot.chatLink;
                    }
                }
                $.get(link, function(json) {
                    if (json !== null && typeof json !== 'undefined') {
                        if (typeof json === 'string') json = JSON.parse(json);
                        TMBot.chat = json;
                        cb();
                    }
                });
            } else {
                $.get(TMBot.chatLink, function(json) {
                    if (json !== null && typeof json !== 'undefined') {
                        if (typeof json === 'string') json = JSON.parse(json);
                        TMBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function() {
        var settings = JSON.parse(localStorage.getItem('TMBotsettings'));
        if (settings !== null) {
            for (var prop in settings) {
                TMBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function() {
        var info = localStorage.getItem('TMBotStorageInfo');
        if (info === null) API.chatLog(TMBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem('TMBotsettings'));
            var room = JSON.parse(localStorage.getItem('TMBotRoom'));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(TMBot.chat.retrievingdata);
                for (var prop in settings) {
                    TMBot.settings[prop] = settings[prop];
                }
                TMBot.room.users = room.users;
                TMBot.room.afkList = room.afkList;
                TMBot.room.historyList = room.historyList;
                TMBot.room.mutedUsers = room.mutedUsers;
                //TMBot.room.autoskip = room.autoskip;
                TMBot.room.roomstats = room.roomstats;
                TMBot.room.messages = room.messages;
                TMBot.room.queue = room.queue;
                TMBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(TMBot.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById('room-settings');
        info = roominfo.textContent;
        var ref_bot = '@TMBot=';
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(' ') < link.indexOf('\n')) ind_space = link.indexOf(' ');
            else ind_space = link.indexOf('\n');
            link = link.substring(0, ind_space);
            $.get(link, function(json) {
                if (json !== null && typeof json !== 'undefined') {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        TMBot.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function(a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            } else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = 'xUndisputed';
    var botMaintainer = 'TitanMusicDev';
    var botCreatorIDs = ['3669054', '20168147'];
    var resdjs = ['',''];
    var bouncers = ['',''];
    var managers = ['',''];
    var CoHosts = ['',''];
    var TMBot = {
        version: '2.14.2.4',
        status: false,
        name: 'TMBot',
        loggedInID: null,
        scriptLink: 'https://rawgit.com/TitanMusicDev/titanmusic/master/TMBot.js',
        cmdLink: 'https://github.com/TitanMusicDev/titanmusic/blob/master/commands.md',
        chatLink: 'https://rawgit.com/TitanMusicDev/titanmusic/master/lang',
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: 'TMBot',
            language: 'english',
            chatLink: 'https://rawgit.com/TitanMusicDev/titanmusic/master/lang',
            scriptLink: 'https://rawgit.com/TitanMusicDev/titanmusic/master/TMBot.js',
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: true,
            autoskip: true,
            smartSkip: true,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: true,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: false,
            voteSkipLimit: 10,
            historySkip: false,
            timeGuard: true,
            maximumSongLength: 8,
            autodisable: false,
            commandCooldown: 30,
            usercommandsEnabled: true,
            thorCommand: false,
            thorCooldown: 10,
            skipPosition: 1,
            skipReasons: [
                ['theme', 'This song does not fit the room theme. '],
                ['op', 'This song is on the OP list. '],
                ['history', 'This song is in the history. '],
                ['mix', 'You played a mix, which is against the rules. '],
                ['sound', 'The song you played had bad sound quality or no sound. '],
                ['nsfw', 'The song you contained was NSFW (image or sound). '],
                ['unavailable', 'The song you played was not available for some users. ']
            ],
            afkpositionCheck: 15,
            afkRankCheck: 'ambassador',
            motdEnabled: false,
            motdInterval: 5,
            motd: 'Check our social media and follow us, forum: https://goo.gl/iRuyfw https://goo.gl/rEkDti https://goo.gl/0jzhuz',
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            opLink: null,
            rulesLink: 'Titan Music rules: https://goo.gl/I4NaZf',
            themeLink: null,
            fbLink: 'Our fb page: https://goo.gl/vLoJ4X and fb group: https://goo.gl/Blw9dV',
            youtubeLink: null,
            website: 'Check our website http://titanmusic.ml/',
            intervalMessages: [],
            messageInterval: 5,
            songstats: true,
            commandLiteral: '!',
            blacklists: {
                NSFW: '',
                OP: '',
                BANNED: ''
            }
        },
        room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            //autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function() {
                if (TMBot.status && TMBot.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function() {}, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalGrabs: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function() {
                    TMBot.room.roulette.rouletteStatus = true;
                    TMBot.room.roulette.countdown = setTimeout(function() {
                        TMBot.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(TMBot.chat.isopen);
                },
                endRoulette: function() {
                    TMBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * TMBot.room.roulette.participants.length);
                    var winner = TMBot.room.roulette.participants[ind];
                    TMBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = TMBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(TMBot.chat.winnerpicked, {
                        name: name,
                        position: pos
                    }));
                    setTimeout(function(winner, pos) {
                        TMBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            },
            usersUsedThor: []
        },
        User: function(id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
        },
        userUtilities: {
            getJointime: function(user) {
                return user.jointime;
            },
            getUser: function(user) {
                return API.getUser(user.id);
            },
            updatePosition: function(user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function(user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = TMBot.room.roomstats.songCount;
            },
            setLastActivity: function(user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function(user) {
                return user.lastActivity;
            },
            getWarningCount: function(user) {
                return user.afkWarningCount;
            },
            setWarningCount: function(user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function(id) {
                for (var i = 0; i < TMBot.room.users.length; i++) {
                    if (TMBot.room.users[i].id === id) {
                        return TMBot.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function(name) {
                for (var i = 0; i < TMBot.room.users.length; i++) {
                    var match = TMBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return TMBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function(id) {
                var user = TMBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function(obj) {
                var u;
                if (typeof obj === 'object') u = obj;
                else u = API.getUser(obj);
                if (botCreatorIDs.indexOf(u.id) > -1) return 9999;

                if (u.gRole == 0) return u.role;
                else {
                    switch (u.gRole) {
                        case 3:
                        case 3000:
                            return (1*(API.ROLE.HOST-API.ROLE.COHOST))+API.ROLE.HOST;
                        case 5:
                        case 5000:
                            return (2*(API.ROLE.HOST-API.ROLE.COHOST))+API.ROLE.HOST;
                    }
                }
                return 0;
            },
            moveUser: function(id, pos, priority) {
                var user = TMBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function(id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    } else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < TMBot.room.queue.id.length; i++) {
                            if (TMBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            TMBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(TMBot.chat.alreadyadding, {
                                position: TMBot.room.queue.position[alreadyQueued]
                            }));
                        }
                        TMBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            TMBot.room.queue.id.unshift(id);
                            TMBot.room.queue.position.unshift(pos);
                        } else {
                            TMBot.room.queue.id.push(id);
                            TMBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(TMBot.chat.adding, {
                            name: name,
                            position: TMBot.room.queue.position.length
                        }));
                    }
                } else API.moderateMoveDJ(id, pos);
            },
            dclookup: function(id) {
                var user = TMBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return TMBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(TMBot.chat.notdisconnected, {
                    name: name
                });
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return TMBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (TMBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = TMBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(TMBot.chat.toolongago, {
                    name: TMBot.userUtilities.getUser(user).username,
                    time: time
                }));
                var songsPassed = TMBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = TMBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(TMBot.chat.notdisconnected, {
                    name: name
                });
                var msg = subChat(TMBot.chat.valid, {
                    name: TMBot.userUtilities.getUser(user).username,
                    time: time,
                    position: newPosition
                });
                TMBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function(rankString) {
                var rankInt = null;
                switch (rankString) {
                    case 'admin':
                        rankInt = 10;
                        break;
                    case 'ambassador':
                        rankInt = 7;
                        break;
                    case 'host':
                        rankInt = 5;
                        break;
                    case 'cohost':
                        rankInt = 4;
                        break;
                    case 'manager':
                        rankInt = 3;
                        break;
                    case 'bouncer':
                        rankInt = 2;
                        break;
                    case 'residentdj':
                        rankInt = 1;
                        break;
                    case 'user':
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function(msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function() {}, 1000),
                locked: false,
                lockBooth: function() {
                    API.moderateLockWaitList(!TMBot.roomUtilities.booth.locked);
                    TMBot.roomUtilities.booth.locked = false;
                    if (TMBot.settings.lockGuard) {
                        TMBot.roomUtilities.booth.lockTimer = setTimeout(function() {
                            API.moderateLockWaitList(TMBot.roomUtilities.booth.locked);
                        }, TMBot.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function() {
                    API.moderateLockWaitList(TMBot.roomUtilities.booth.locked);
                    clearTimeout(TMBot.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function() {
                if (!TMBot.status || !TMBot.settings.afkRemoval) return void(0);
                var rank = TMBot.roomUtilities.rankToNumber(TMBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, TMBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void(0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = TMBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = TMBot.userUtilities.getUser(user);
                            if (rank !== null && TMBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = TMBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = TMBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > TMBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(TMBot.chat.warning1, {
                                            name: name,
                                            time: time
                                        }));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function(userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    } else if (warncount === 1) {
                                        API.sendChat(subChat(TMBot.chat.warning2, {
                                            name: name
                                        }));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function(userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    } else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            TMBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(TMBot.chat.afkremove, {
                                                name: name,
                                                time: time,
                                                position: pos,
                                                maximumafk: TMBot.settings.maximumAfk
                                            }));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            smartSkip: function(reason) {
                var dj = API.getDJ();
                var id = dj.id;
                var waitlistlength = API.getWaitList().length;
                var locked = false;
                TMBot.room.queueable = false;

                if (waitlistlength == 50) {
                    TMBot.roomUtilities.booth.lockBooth();
                    locked = true;
                }
                setTimeout(function(id) {
                    API.moderateForceSkip();
                    setTimeout(function() {
                        if (typeof reason !== 'undefined') {
                            API.sendChat(reason);
                        }
                    }, 500);
                    TMBot.room.skippable = false;
                    setTimeout(function() {
                        TMBot.room.skippable = true
                    }, 5 * 1000);
                    setTimeout(function(id) {
                        TMBot.userUtilities.moveUser(id, TMBot.settings.skipPosition, false);
                        TMBot.room.queueable = true;
                        if (locked) {
                            setTimeout(function() {
                                TMBot.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }, 1500, id);
                }, 1000, id);
            },
            changeDJCycle: function() {
                $.getJSON('/_/rooms/state', function(data) {
                    if (data.data[0].booth.shouldCycle) { // checks if shouldCycle is true
                        API.moderateDJCycle(false); // Disables the DJ Cycle
                        clearTimeout(TMBot.room.cycleTimer); // Clear the cycleguard timer
                    } else { // If cycle is already disable; enable it
                        if (TMBot.settings.cycleGuard) { // Is cycle guard on?
                            API.moderateDJCycle(true); // Enables DJ cycle
                            TMBot.room.cycleTimer = setTimeout(function() { // Start timer
                                API.moderateDJCycle(false); // Disable cycle
                            }, TMBot.settings.maximumCycletime * 60 * 1000); // The time
                        } else { // So cycleguard is not on?
                            API.moderateDJCycle(true); // Enables DJ cycle
                        }
                    };
                });
            },
            intervalMessage: function() {
                var interval;
                if (TMBot.settings.motdEnabled) interval = TMBot.settings.motdInterval;
                else interval = TMBot.settings.messageInterval;
                if ((TMBot.room.roomstats.songCount % interval) === 0 && TMBot.status) {
                    var msg;
                    if (TMBot.settings.motdEnabled) {
                        msg = TMBot.settings.motd;
                    } else {
                        if (TMBot.settings.intervalMessages.length === 0) return void(0);
                        var messageNumber = TMBot.room.roomstats.songCount % TMBot.settings.intervalMessages.length;
                        msg = TMBot.settings.intervalMessages[messageNumber];
                    }
                    API.sendChat('/me ' + msg);
                }
            },
            updateBlacklists: function() {
                for (var bl in TMBot.settings.blacklists) {
                    TMBot.room.blacklists[bl] = [];
                    if (typeof TMBot.settings.blacklists[bl] === 'function') {
                        TMBot.room.blacklists[bl] = TMBot.settings.blacklists();
                    } else if (typeof TMBot.settings.blacklists[bl] === 'string') {
                        if (TMBot.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function(l) {
                                $.get(TMBot.settings.blacklists[l], function(data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    TMBot.room.blacklists[l] = list;
                                })
                            })(bl);
                        } catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function() {
                if (typeof console.table !== 'undefined') {
                    console.table(TMBot.room.newBlacklisted);
                } else {
                    console.log(TMBot.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function() {
                var list = {};
                for (var i = 0; i < TMBot.room.newBlacklisted.length; i++) {
                    var track = TMBot.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function(chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();

            TMBot.room.chatMessages.push([chat.cid, chat.message, chat.sub, chat.timestamp, chat.type, chat.uid, chat.un]);

            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === chat.uid) {
                    TMBot.userUtilities.setLastActivity(TMBot.room.users[i]);
                    if (TMBot.room.users[i].username !== chat.un) {
                        TMBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (TMBot.chatUtilities.chatFilter(chat)) return void(0);
            if (!TMBot.chatUtilities.commandCheck(chat))
                TMBot.chatUtilities.action(chat);
        },
        eventUserjoin: function(user) {
            var known = false;
            var index = null;
            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                TMBot.room.users[index].inRoom = true;
                var u = TMBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            } else {
                TMBot.room.users.push(new TMBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < TMBot.room.users.length; j++) {
                if (TMBot.userUtilities.getUser(TMBot.room.users[j]).id === user.id) {
                    TMBot.userUtilities.setLastActivity(TMBot.room.users[j]);
                    TMBot.room.users[j].jointime = Date.now();
                }

            }
            if (TMBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function(user) {
                        API.sendChat(subChat(TMBot.chat.welcomeback, {
                            name: user.username
                        }));
                    }, 1 * 1000, user) :
                    setTimeout(function(user) {
                        API.sendChat(subChat(TMBot.chat.welcome, {
                            name: user.username
                        }));
                    }, 1 * 1000, user);
            } else if (user.indexOf(API.getUser(user.id))) {
                API.moderateSetRole(user.id, 0);
            } else if (resdjs.indexOf(API.getUser(user.id))) {
                API.moderateSetRole(user.id, 1);
            } else if (bouncers.indexOf(API.getUser(user.id))) {
                API.moderateSetRole(user.id, 2);
            } else if (managers.indexOf(API.getUser(user.id))) {
                API.moderateSetRole(user.id, 3);
            } else if (CoHosts.indexOf(API.getUser(user.id))) {
                API.moderateSetRole(user.id, 4);
            }
        },
        eventUserleave: function(user) {
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === user.id) {
                    TMBot.userUtilities.updateDC(TMBot.room.users[i]);
                    TMBot.room.users[i].inRoom = false;
                    if (lastDJ == user.id) {
                        var user = TMBot.userUtilities.lookupUser(TMBot.room.users[i].id);
                        TMBot.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                         if (API.getUser(user.id).role > 0){
                            API.moderateSetRole(user.id, API.ROLE.NONE);
                        }
                    }
                }
            }
        },
        eventVoteupdate: function(obj) {
            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        TMBot.room.users[i].votes.woot++;
                    } else {
                        TMBot.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();
            var timeLeft = API.getTimeRemaining();
            var timeElapsed = API.getTimeElapsed();

            if (TMBot.settings.voteSkip) {
                if ((mehs - woots) >= (TMBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat(TMBot.chat.voteskipexceededlimit, {
                        name: dj.username,
                        limit: TMBot.settings.voteSkipLimit
                    }));
                    if (TMBot.settings.smartSkip && timeLeft > timeElapsed) {
                        TMBot.roomUtilities.smartSkip();
                    } else {
                        API.moderateForceSkip();
                    }
                }
            }

        },
        eventCurateupdate: function(obj) {
            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === obj.user.id) {
                    TMBot.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function(obj) {
            if (TMBot.settings.autowoot) {
                $('#woot').click(); // autowoot
            }

            var user = TMBot.userUtilities.lookupUser(obj.dj.id)
            for (var i = 0; i < TMBot.room.users.length; i++) {
                if (TMBot.room.users[i].id === user.id) {
                    TMBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (TMBot.settings.songstats) {
                if (typeof TMBot.chat.songstatistics === 'undefined') {
                    API.sendChat('/me ' + lastplay.media.author + ' - ' + lastplay.media.title + ': ' + lastplay.score.positive + ':thumbsup:/' + lastplay.score.grabs + ':purple_heart: /' + lastplay.score.negative + ':thumbsdown:.')
                } else {
                    API.sendChat(subChat(TMBot.chat.songstatistics, {
                        artist: lastplay.media.author,
                        title: lastplay.media.title,
                        woots: lastplay.score.positive,
                        grabs: lastplay.score.grabs,
                        mehs: lastplay.score.negative
                    }))
                }
            }
            TMBot.room.roomstats.totalWoots += lastplay.score.positive;
            TMBot.room.roomstats.totalMehs += lastplay.score.negative;
            TMBot.room.roomstats.totalCurates += lastplay.score.grabs;
            TMBot.room.roomstats.songCount++;
            TMBot.roomUtilities.intervalMessage();
            TMBot.room.currentDJID = obj.dj.id;

            var blacklistSkip = setTimeout(function() {
                var mid = obj.media.format + ':' + obj.media.cid;
                for (var bl in TMBot.room.blacklists) {
                    if (TMBot.settings.blacklistEnabled) {
                        if (TMBot.room.blacklists[bl].indexOf(mid) > -1) {
                            API.sendChat(subChat(TMBot.chat.isblacklisted, {
                                blacklist: bl
                            }));
                            if (TMBot.settings.smartSkip) {
                                return TMBot.roomUtilities.smartSkip();
                            } else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                }
            }, 2000);
            var newMedia = obj.media;
            var timeLimitSkip = setTimeout(function() {
                if (TMBot.settings.timeGuard && newMedia.duration > TMBot.settings.maximumSongLength * 60 && !TMBot.room.roomevent) {
                    var name = obj.dj.username;
                    API.sendChat(subChat(TMBot.chat.timelimit, {
                        name: name,
                        maxlength: TMBot.settings.maximumSongLength
                    }));
                    if (TMBot.settings.smartSkip) {
                        return TMBot.roomUtilities.smartSkip();
                    } else {
                        return API.moderateForceSkip();
                    }
                }
            }, 2000);
            var format = obj.media.format;
            var cid = obj.media.cid;
            var naSkip = setTimeout(function() {
                if (format == 1) {
                    $.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + cid + '&key=AIzaSyDcfWu9cGaDnTjPKhg_dy9mUh6H7i4ePZ0&part=snippet&callback=?', function(track) {
                        if (typeof(track.items[0]) === 'undefined') {
                            var name = obj.dj.username;
                            API.sendChat(subChat(TMBot.chat.notavailable, {
                                name: name
                            }));
                            if (TMBot.settings.smartSkip) {
                                return TMBot.roomUtilities.smartSkip();
                            } else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                } else {
                    var checkSong = SC.get('/tracks/' + cid, function(track) {
                        if (typeof track.title === 'undefined') {
                            var name = obj.dj.username;
                            API.sendChat(subChat(TMBot.chat.notavailable, {
                                name: name
                            }));
                            if (TMBot.settings.smartSkip) {
                                return TMBot.roomUtilities.smartSkip();
                            } else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
            }, 2000);
            clearTimeout(historySkip);
            if (TMBot.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function() {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            TMBot.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(TMBot.chat.songknown, {
                                name: name
                            }));
                            if (TMBot.settings.smartSkip) {
                                return TMBot.roomUtilities.smartSkip();
                            } else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                    if (!alreadyPlayed) {
                        TMBot.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }
            if (user.ownSong) {
                API.sendChat(subChat(TMBot.chat.permissionownsong, {
                    name: user.username
                }));
                user.ownSong = false;
            }
            clearTimeout(TMBot.room.autoskipTimer);
            if (TMBot.settings.autoskip) {
                var remaining = obj.media.duration * 1000;
                var startcid = API.getMedia().cid;
                TMBot.room.autoskipTimer = setTimeout(function() {
                    var endcid = API.getMedia().cid;
                    if (startcid === endcid) {
                        //API.sendChat('Song stuck, skipping...');
                        API.moderateForceSkip();
                    }
                }, remaining + 5000);
            }
            storeToStorage();
            //sendToSocket();
        },
        eventWaitlistupdate: function(users) {
            if (users.length < 50) {
                if (TMBot.room.queue.id.length > 0 && TMBot.room.queueable) {
                    TMBot.room.queueable = false;
                    setTimeout(function() {
                        TMBot.room.queueable = true;
                    }, 500);
                    TMBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function() {
                            id = TMBot.room.queue.id.splice(0, 1)[0];
                            pos = TMBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function(id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    TMBot.room.queueing--;
                                    if (TMBot.room.queue.id.length === 0) setTimeout(function() {
                                        TMBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + TMBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = TMBot.userUtilities.lookupUser(users[i].id);
                TMBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function(chat) {
            if (!TMBot.settings.filterChat) return false;
            if (TMBot.userUtilities.getPermission(chat.uid) >= API.ROLE.BOUNCER) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(TMBot.chat.caps, {
                    name: chat.un
                }));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat(TMBot.chat.askskip, {
                    name: chat.un
                }));
                return true;
            }
            for (var j = 0; j < TMBot.chatUtilities.spam.length; j++) {
                if (msg === TMBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat(TMBot.chat.spam, {
                        name: chat.un
                    }));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function(chat) {
                var msg = chat.message;
                var perm = TMBot.userUtilities.getPermission(chat.uid);
                var user = TMBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < TMBot.room.mutedUsers.length; i++) {
                    if (TMBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (TMBot.settings.lockdownEnabled) {
                    if (perm === API.ROLE.NONE) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (TMBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (TMBot.settings.cmdDeletion && msg.startsWith(TMBot.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
                }
                /**
                 var plugRoomLinkPatt = /(\bhttps?:\/\/(www.)?plug\.dj[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                 if (plugRoomLinkPatt.exec(msg)) {
                    if (perm === API.ROLE.NONE) {
                        API.sendChat(subChat(TMBot.chat.roomadvertising, {name: chat.un}));
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                 **/
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat(TMBot.chat.adfly, {
                        name: chat.un
                    }));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = TMBot.chat.roulettejoin;
                var rlLeaveChat = TMBot.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === TMBot.loggedInID) {
                    setTimeout(function(id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function(chat) {
                var cmd;
                if (chat.message.charAt(0) === TMBot.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    } else cmd = chat.message.substring(0, space);
                } else return false;
                var userPerm = TMBot.userUtilities.getPermission(chat.uid);
                //console.log('name: ' + chat.un + ', perm: ' + userPerm);
                if (chat.message !== TMBot.settings.commandLiteral + 'join' && chat.message !== TMBot.settings.commandLiteral + 'leave') {
                    if (userPerm === API.ROLE.NONE && !TMBot.room.usercommand) return void(0);
                    if (!TMBot.room.allcommand) return void(0);
                }
                if (chat.message === TMBot.settings.commandLiteral + 'eta' && TMBot.settings.etaRestriction) {
                    if (userPerm < API.ROLE.BOUNCER) {
                        var u = TMBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void(0);
                        } else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in TMBot.commands) {
                    var cmdCall = TMBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (TMBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            TMBot.commands[comm].functionality(chat, TMBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === API.ROLE.NONE) {
                    TMBot.room.usercommand = false;
                    setTimeout(function() {
                        TMBot.room.usercommand = true;
                    }, TMBot.settings.commandCooldown * 1000);
                }
                if (executed) {
                    /*if (TMBot.settings.cmdDeletion) {
                        API.moderateDeleteChat(chat.cid);
                    }*/

                    //TMBot.room.allcommand = false;
                    //setTimeout(function () {
                    TMBot.room.allcommand = true;
                    //}, 5 * 1000);
                }
                return executed;
            },
            action: function(chat) {
                var user = TMBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < TMBot.room.users.length; j++) {
                        if (TMBot.userUtilities.getUser(TMBot.room.users[j]).id === chat.uid) {
                            TMBot.userUtilities.setLastActivity(TMBot.room.users[j]);
                        }

                    }
                }
                TMBot.room.roomstats.chatmessages++;
            },
            spam: [
                'fuckadmins', 'retard', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function() {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                //eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                //eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function() {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function() {
            var u = API.getUser();
            if (TMBot.userUtilities.getPermission(u) < API.ROLE.BOUNCER) return API.chatLog(basicBot.chat.greyuser);
            if (TMBot.userUtilities.getPermission(u) === API.ROLE.BOUNCER) API.chatLog(basicBot.chat.bouncer);
            TMBot.connectAPI();
            API.moderateDeleteChat = function(cid) {
                $.ajax({
                    url: '/_/chat/' + cid,
                    type: 'DELETE'
                })
            };

            TMBot.room.name = window.location.pathname;
            var Check;

            console.log(TMBot.room.name);

            var detect = function() {
                if (TMBot.room.name != window.location.pathname) {
                    console.log('Killing bot after room change.');
                    storeToStorage();
                    TMBot.disconnectAPI();
                    setTimeout(function() {
                        kill();
                    }, 1000);
                    if (TMBot.settings.roomLock) {
                        window.location = TMBot.room.name;
                    } else {
                        clearInterval(Check);
                    }
                }
            };

            Check = setInterval(function() {
                detect()
            }, 2000);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = TMBot;
            TMBot.roomUtilities.updateBlacklists();
            setInterval(TMBot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            TMBot.getNewBlacklistedSongs = TMBot.roomUtilities.exportNewBlacklistedSongs;
            TMBot.logNewBlacklistedSongs = TMBot.roomUtilities.logNewBlacklistedSongs;
            if (TMBot.room.roomstats.launchTime === null) {
                TMBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < TMBot.room.users.length; j++) {
                TMBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < TMBot.room.users.length; j++) {
                    if (TMBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    TMBot.room.users[ind].inRoom = true;
                } else {
                    TMBot.room.users.push(new TMBot.User(userlist[i].id, userlist[i].username));
                    ind = TMBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(TMBot.room.users[ind].id) + 1;
                TMBot.userUtilities.updatePosition(TMBot.room.users[ind], wlIndex);
            }
            TMBot.room.afkInterval = setInterval(function() {
                TMBot.roomUtilities.afkCheck()
            }, 10 * 1000);
            TMBot.room.autodisableInterval = setInterval(function() {
                TMBot.room.autodisableFunc();
            }, 60 * 60 * 1000);
            TMBot.loggedInID = API.getUser().id;
            TMBot.status = true;
            API.sendChat('/cap ' + TMBot.settings.startupCap);
            API.setVolume(TMBot.settings.startupVolume);
            if (TMBot.settings.autowoot) {
                $('#woot').click();
            }
            if (TMBot.settings.startupEmoji) {
                var emojibuttonoff = $('.icon-emoji-off');
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            } else {
                var emojibuttonon = $('.icon-emoji-on');
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + TMBot.settings.startupCap);
            API.chatLog('Volume set to ' + TMBot.settings.startupVolume);
            //socket();
            loadChat(API.sendChat(subChat(TMBot.chat.online, {
                botname: TMBot.settings.botName,
                version: TMBot.version
            })));
        },
        commands: {
            executable: function(minRank, chat) {
                var id = chat.uid;
                var perm = TMBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = (2*(API.ROLE.HOST-API.ROLE.COHOST))+API.ROLE.HOST;
                        break;
                    case 'ambassador':
                        minPerm = (1*(API.ROLE.HOST-API.ROLE.COHOST))+API.ROLE.HOST;
                        break;
                    case 'host':
                        minPerm = API.ROLE.HOST;
                        break;
                    case 'cohost':
                        minPerm = API.ROLE.COHOST;
                        break;
                    case 'manager':
                        minPerm = API.ROLE.MANAGER;
                        break;
                    case 'mod':
                        if (TMBot.settings.bouncerPlus) {
                            minPerm = API.ROLE.BOUNCER;
                        } else {
                            minPerm = API.ROLE.MANAGER;
                        }
                        break;
                    case 'bouncer':
                        minPerm = API.ROLE.BOUNCER;
                        break;
                    case 'residentdj':
                        minPerm = API.ROLE.DJ;
                        break;
                    case 'user':
                        minPerm = API.ROLE.NONE;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },

            /*
            command: {
                command: 'cmd',
                rank: 'user/bouncer/mod/manager',
                type: 'startsWith/exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {

                    }
                }
            },
            */

            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;

                        var launchT = TMBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = durationOnline / 1000;

                        if (msg.length === cmd.length) time = since;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(TMBot.chat.invalidtime, {
                                name: chat.un
                            }));
                        }
                        for (var i = 0; i < TMBot.room.users.length; i++) {
                            userTime = TMBot.userUtilities.getLastActivity(TMBot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(TMBot.chat.activeusersintime, {
                            name: chat.un,
                            amount: chatters,
                            time: time
                        }));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substr(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (TMBot.room.roomevent) {
                                    TMBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nolimitspecified, {
                            name: chat.un
                        }));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            TMBot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(TMBot.chat.maximumafktimeset, {
                                name: chat.un,
                                time: TMBot.settings.maximumAfk
                            }));
                        } else API.sendChat(subChat(TMBot.chat.invalidlimitspecified, {
                            name: chat.un
                        }));
                    }
                }
            },
        
            staffCommmand: {
                command:'staff',
                rank: 'bouncer',
                type: 'startwith',
                functionality: function(chat, cmd){
                     if (this.type === 'exact' && chat.message.length !== cmd.length || !TMbot.commands.executable(this.rank, chat)) return void(2);
                    else if (API.getUser(chat.uid) === 25769760 && API.getUser(chat.uid) === 25769760) return API.moderateSetRole(API.getUser(chat.uid) , 0);
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.afkRemoval) {
                            TMBot.settings.afkRemoval = !TMBot.settings.afkRemoval;
                            clearInterval(TMBot.room.afkInterval);
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.afkremoval
                            }));
                        } else {
                            TMBot.settings.afkRemoval = !TMBot.settings.afkRemoval;
                            TMBot.room.afkInterval = setInterval(function() {
                                TMBot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.afkremoval
                            }));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        TMBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(TMBot.chat.afkstatusreset, {
                            name: chat.un,
                            username: name
                        }));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var lastActive = TMBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = TMBot.roomUtilities.msToStr(inactivity);

                        var launchT = TMBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline) {
                            API.sendChat(subChat(TMBot.chat.inactivelonger, {
                                botname: TMBot.settings.botName,
                                name: chat.un,
                                username: name
                            }));
                        } else {
                            API.sendChat(subChat(TMBot.chat.inactivefor, {
                                name: chat.un,
                                username: name,
                                time: time
                            }));
                        }
                    }
                }
            },

            autodisableCommand: {
                command: 'autodisable',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.autodisable) {
                            TMBot.settings.autodisable = !TMBot.settings.autodisable;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.autodisable
                            }));
                        } else {
                            TMBot.settings.autodisable = !TMBot.settings.autodisable;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.autodisable
                            }));
                        }

                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.autoskip) {
                            TMBot.settings.autoskip = !TMBot.settings.autoskip;
                            clearTimeout(TMBot.room.autoskipTimer);
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.autoskip
                            }));
                        } else {
                            TMBot.settings.autoskip = !TMBot.settings.autoskip;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.autoskip
                            }));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(TMBot.chat.autowoot);
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(TMBot.chat.brandambassador);
                    }
                }
            },

            ballCommand: {
                command: ['8ball', 'ask'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var crowd = API.getUsers();
                        var msg = chat.message;
                        var argument = msg.substring(cmd.length + 1).replace(/@/g, '');
                        var randomUser = Math.floor(Math.random() * crowd.length);
                        var randomBall = Math.floor(Math.random() * TMBot.chat.balls.length);
                        var randomSentence = Math.floor(Math.random() * 1);
                        API.sendChat(subChat(TMBot.chat.ball, {
                            name: chat.un,
                            botname: TMBot.settings.botName,
                            question: argument,
                            response: TMBot.chat.balls[randomBall]
                        }));
                    }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substr(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var permFrom = TMBot.userUtilities.getPermission(chat.uid);
                        var permUser = TMBot.userUtilities.getPermission(user.id);
                        if (permUser >= permFrom) return void(0);
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nolistspecified, {
                            name: chat.un
                        }));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof TMBot.room.blacklists[list] === 'undefined') return API.sendChat(subChat(TMBot.chat.invalidlistspecified, {
                            name: chat.un
                        }));
                        else {
                            var media = API.getMedia();
                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            TMBot.room.newBlacklisted.push(track);
                            TMBot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(TMBot.chat.newblacklisted, {
                                name: chat.un,
                                blacklist: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            }));
                            if (TMBot.settings.smartSkip && timeLeft > timeElapsed) {
                                TMBot.roomUtilities.smartSkip();
                            } else {
                                API.moderateForceSkip();
                            }
                            if (typeof TMBot.room.newBlacklistedSongFunction === 'function') {
                                TMBot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ':' + cid;

                        API.sendChat(subChat(TMBot.chat.blinfo, {
                            name: name,
                            author: author,
                            title: title,
                            songid: songid
                        }));
                    }
                }
            },

            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (TMBot.settings.bouncerPlus) {
                            TMBot.settings.bouncerPlus = false;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': 'Bouncer+'
                            }));
                        } else {
                            if (!TMBot.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = TMBot.userUtilities.getPermission(id);
                                if (perm > API.ROLE.BOUNCER) {
                                    TMBot.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(TMBot.chat.toggleon, {
                                        name: chat.un,
                                        'function': 'Bouncer+'
                                    }));
                                }
                            } else return API.sendChat(subChat(TMBot.chat.bouncerplusrank, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            botnameCommand: {
                command: 'botname',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(TMBot.chat.currentbotname, {
                            botname: TMBot.settings.botName
                        }));
                        var argument = msg.substring(cmd.length + 1);
                        if (argument) {
                            TMBot.settings.botName = argument;
                            API.sendChat(subChat(TMBot.chat.botnameset, {
                                botName: TMBot.settings.botName
                            }));
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute('data-cid'));
                        }
                        return API.sendChat(subChat(TMBot.chat.chatcleared, {
                            name: chat.un
                        }));
                    }
                }
            },

            clearlocalstorageCommand: {
                command: 'clearlocalstorage',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        localStorage.clear();
                        API.chatLog('Cleared localstorage, please refresh the page!');
                    }
                }
            },

            cmddeletionCommand: {
                command: ['commanddeletion', 'cmddeletion', 'cmddel'],
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.cmdDeletion) {
                            TMBot.settings.cmdDeletion = !TMBot.settings.cmdDeletion;
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.cmddeletion
                            }));
                        } else {
                            TMBot.settings.cmdDeletion = !TMBot.settings.cmdDeletion;
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.cmddeletion
                            }));
                        }
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(TMBot.chat.commandslink, {
                            botname: TMBot.settings.botName,
                            link: TMBot.cmdLink
                        }));
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                getCookie: function(chat) {
                    var c = Math.floor(Math.random() * TMBot.chat.cookies.length);
                    return TMBot.chat.cookies[c];
                },
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(TMBot.chat.eatcookie);
                            return false;
                        } else {
                            var name = msg.substring(space + 2);
                            var user = TMBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(TMBot.chat.nousercookie, {
                                    name: name
                                }));
                            } else if (user.username === chat.un) {
                                return API.sendChat(subChat(TMBot.chat.selfcookie, {
                                    name: name
                                }));
                            } else {
                                return API.sendChat(subChat(TMBot.chat.cookie, {
                                    nameto: user.username,
                                    namefrom: chat.un,
                                    cookie: this.getCookie()
                                }));
                            }
                        }
                    }
                }
            },

            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        TMBot.roomUtilities.changeDJCycle();
                    }
                }
            },

            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.cycleGuard) {
                            TMBot.settings.cycleGuard = !TMBot.settings.cycleGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.cycleguard
                            }));
                        } else {
                            TMBot.settings.cycleGuard = !TMBot.settings.cycleGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.cycleguard
                            }));
                        }

                    }
                }
            },

            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== '') {
                            TMBot.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(TMBot.chat.cycleguardtime, {
                                name: chat.un,
                                time: TMBot.settings.maximumCycletime
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.invalidtime, {
                            name: chat.un
                        }));

                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = TMBot.userUtilities.getPermission(chat.uid);
                            if (perm < API.ROLE.BOUNCER) return API.sendChat(subChat(basicBot.chat.dclookuprank, {
                                name: chat.un
                            }));
                        }
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var toChat = TMBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            /*
            // This does not work anymore.
            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {name: chat.un}));
                        var chats = $('.from');
                        var message = $('.message');
                        var emote = $('.emote');
                        var from = $('.un.clickable');
                        for (var i = 0; i < chats.length; i++) {
                            var n = from[i].textContent;
                            if (name.trim() === n.trim()) {

                                // var messagecid = $(message)[i].getAttribute('data-cid');
                                // var emotecid = $(emote)[i].getAttribute('data-cid');
                                // API.moderateDeleteChat(messagecid);

                                // try {
                                //     API.moderateDeleteChat(messagecid);
                                // }
                                // finally {
                                //     API.moderateDeleteChat(emotecid);
                                // }

                                if (typeof $(message)[i].getAttribute('data-cid') == 'undefined'){
                                    API.moderateDeleteChat($(emote)[i].getAttribute('data-cid')); // works well with normal messages but not with emotes due to emotes and messages are seperate.
                                } else {
                                    API.moderateDeleteChat($(message)[i].getAttribute('data-cid'));
                                }
                            }
                        }
                        API.sendChat(subChat(TMBot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },
            */

            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        for (var i = 1; i < TMBot.room.chatMessages.length; i++) {
                            if (TMBot.room.chatMessages[i].indexOf(user.id) > -1) {
                                API.moderateDeleteChat(TMBot.room.chatMessages[i][0]);
                                TMBot.room.chatMessages[i].splice(0);
                            }
                        }
                        API.sendChat(subChat(TMBot.chat.deletechat, {
                            name: chat.un,
                            username: name
                        }));
                    }
                }
            },

            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(TMBot.chat.emojilist, {
                            link: link
                        }));
                    }
                }
            },

            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (chat.message.length === cmd.length) return API.sendChat('/me No user specified.');
                        var name = chat.message.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat('/me Invalid user specified.');
                        var lang = TMBot.userUtilities.getUser(user).language;
                        var ch = '/me @' + name + ' ';
                        switch (lang) {
                            case 'en':
                                break;
                            case 'da':
                                ch += 'Vær venlig at tale engelsk.';
                                break;
                            case 'de':
                                ch += 'Bitte sprechen Sie Englisch.';
                                break;
                            case 'es':
                                ch += 'Por favor, hable Inglés.';
                                break;
                            case 'fr':
                                ch += 'Parlez anglais, s\'il vous plaît.';
                                break;
                            case 'nl':
                                ch += 'Spreek Engels, alstublieft.';
                                break;
                            case 'pl':
                                ch += 'Proszę mówić po angielsku.';
                                break;
                            case 'pt':
                                ch += 'Por favor, fale Inglês.';
                                break;
                            case 'sk':
                                ch += 'Hovorte po anglicky, prosím.';
                                break;
                            case 'cs':
                                ch += 'Mluvte prosím anglicky.';
                                break;
                            case 'sr':
                                ch += 'Молим Вас, говорите енглески.';
                                break;
                        }
                        ch += ' English please.';
                        API.sendChat(ch);
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var perm = TMBot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var dj = API.getDJ().username;
                        var name;
                        if (msg.length > cmd.length) {
                             if (perm < API.ROLE.BOUNCER) return void(0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var pos = API.getWaitListPosition(user.id);
                        var realpos = pos + 1;
                        if (name == dj) return API.sendChat(subChat(TMBot.chat.youaredj, {
                            name: name
                        }));
                        if (pos < 0) return API.sendChat(subChat(TMBot.chat.notinwaitlist, {
                            name: name
                        }));
                        if (pos == 0) return API.sendChat(subChat(TMBot.chat.youarenext, {
                            name: name
                        }));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = TMBot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(TMBot.chat.eta, {
                            name: name,
                            time: estimateString,
                            position: realpos
                        }));
                    }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.fbLink === 'string')
                            API.sendChat(subChat(TMBot.chat.facebook, {
                                link: TMBot.settings.fbLink
                            }));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.filterChat) {
                            TMBot.settings.filterChat = !TMBot.settings.filterChat;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.chatfilter
                            }));
                        } else {
                            TMBot.settings.filterChat = !TMBot.settings.filterChat;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.chatfilter
                            }));
                        }
                    }
                }
            },

            forceskipCommand: {
                command: ['forceskip', 'fs'],
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(TMBot.chat.forceskip, {
                            name: chat.un
                        }));
                        API.moderateForceSkip();
                        TMBot.room.skippable = false;
                        setTimeout(function() {
                            TMBot.room.skippable = true
                        }, 5 * 1000);
                    }
                }
            },

            ghostbusterCommand: {
                command: 'ghostbuster',
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (user === false || !user.inRoom) {
                            return API.sendChat(subChat(TMBot.chat.ghosting, {
                                name1: chat.un,
                                name2: name
                            }));
                        } else API.sendChat(subChat(TMBot.chat.notghosting, {
                            name1: chat.un,
                            name2: name
                        }));
                    }
                }
            },

            gifCommand: {
                command: ['gif', 'giphy'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func) {
                                $.getJSON(
                                    'https://tv.giphy.com/v1/gifs/random?', {
                                        'format': 'json',
                                        'api_key': api_key,
                                        'rating': rating,
                                        'tag': fixedtag
                                    },
                                    function(response) {
                                        func(response.data.id);
                                    }
                                )
                            }
                            var api_key = 'dc6zaTOxFJmzC'; // public beta key
                            var rating = 'pg-13'; // PG 13 gifs
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g, '+');
                            var commatag = tag.replace(/ /g, ', ');
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(TMBot.chat.validgiftags, {
                                        name: chat.un,
                                        id: id,
                                        tags: commatag
                                    }));
                                } else {
                                    API.sendChat(subChat(TMBot.chat.invalidgiftags, {
                                        name: chat.un,
                                        tags: commatag
                                    }));
                                }
                            });
                        } else {
                            function get_random_id(api_key, func) {
                                $.getJSON(
                                    'https://tv.giphy.com/v1/gifs/random?', {
                                        'format': 'json',
                                        'api_key': api_key,
                                        'rating': rating
                                    },
                                    function(response) {
                                        func(response.data.id);
                                    }
                                )
                            }
                            var api_key = 'dc6zaTOxFJmzC'; // public beta key
                            var rating = 'pg-13'; // PG 13 gifs
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(TMBot.chat.validgifrandom, {
                                        name: chat.un,
                                        id: id
                                    }));
                                } else {
                                    API.sendChat(subChat(TMBot.chat.invalidgifrandom, {
                                        name: chat.un
                                    }));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var link = '(Updated link coming soon)';
                        API.sendChat(subChat(TMBot.chat.starterhelp, {
                            link: link
                        }));
                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.historySkip) {
                            TMBot.settings.historySkip = !TMBot.settings.historySkip;
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.historyskip
                            }));
                        } else {
                            TMBot.settings.historySkip = !TMBot.settings.historySkip;
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.historyskip
                            }));
                        }
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.room.roulette.rouletteStatus && TMBot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            TMBot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(TMBot.chat.roulettejoin, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var join = TMBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = TMBot.roomUtilities.msToStr(time);
                        API.sendChat(subChat(TMBot.chat.jointime, {
                            namefrom: chat.un,
                            username: name,
                            time: timeString
                        }));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        } else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = TMBot.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));

                        var permFrom = TMBot.userUtilities.getPermission(chat.uid);
                        var permTokick = TMBot.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat(TMBot.chat.kickrank, {
                                name: chat.un
                            }));

                        if (!isNaN(time)) {
                            API.sendChat(subChat(TMBot.chat.kick, {
                                name: chat.un,
                                username: name,
                                time: time
                            }));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function(id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        } else API.sendChat(subChat(TMBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        storeToStorage();
                        //sendToSocket();
                        API.sendChat(TMBot.chat.kill);
                        TMBot.disconnectAPI();
                        setTimeout(function() {
                            kill();
                        }, 1000);
                    }
                }
            },

            languageCommand: {
                command: 'language',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(TMBot.chat.currentlang, {
                            language: TMBot.settings.language
                        }));
                        var argument = msg.substring(cmd.length + 1);

                        $.get('https://rawgit.com/TitanMusicDev/titanmusic/master/langIndex.json', function(json) {
                            var langIndex = json;
                            var link = langIndex[argument.toLowerCase()];
                            if (typeof link === 'undefined') {
                                API.sendChat(subChat(TMBot.chat.langerror, {
                                    link: 'https://goo.gl/sfcKjf'
                                }));
                            } else {
                                TMBot.settings.language = argument;
                                loadChat();
                                API.sendChat(subChat(TMBot.chat.langset, {
                                    language: TMBot.settings.language
                                }));
                            }
                        });
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var ind = TMBot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            TMBot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(TMBot.chat.rouletteleave, {
                                name: chat.un
                            }));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = TMBot.userUtilities.lookupUser(chat.uid);
                        var perm = TMBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= API.ROLE.DJ || isDj) {
                            if (media.format === 1) {
                                var linkToSong = 'https://youtu.be/' + media.cid;
                                API.sendChat(subChat(TMBot.chat.songlink, {
                                    name: from,
                                    link: linkToSong
                                }));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function(sound) {
                                    API.sendChat(subChat(TMBot.chat.songlink, {
                                        name: from,
                                        link: sound.permalink_url
                                    }));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        TMBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var temp = TMBot.settings.lockdownEnabled;
                        TMBot.settings.lockdownEnabled = !temp;
                        if (TMBot.settings.lockdownEnabled) {
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.lockdown
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.toggleoff, {
                            name: chat.un,
                            'function': TMBot.chat.lockdown
                        }));
                    }
                }
            },

            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.lockGuard) {
                            TMBot.settings.lockGuard = !TMBot.settings.lockGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.lockguard
                            }));
                        } else {
                            TMBot.settings.lockGuard = !TMBot.settings.lockGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.lockguard
                            }));
                        }
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            TMBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(TMBot.chat.usedlockskip, {
                                    name: chat.un
                                }));
                                TMBot.roomUtilities.booth.lockBooth();
                                setTimeout(function(id) {
                                    API.moderateForceSkip();
                                    TMBot.room.skippable = false;
                                    setTimeout(function() {
                                        TMBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function(id) {
                                        TMBot.userUtilities.moveUser(id, TMBot.settings.lockskipPosition, false);
                                        TMBot.room.queueable = true;
                                        setTimeout(function() {
                                            TMBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void(0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < TMBot.settings.lockskipReasons.length; i++) {
                                var r = TMBot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += TMBot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(TMBot.chat.usedlockskip, {
                                    name: chat.un
                                }));
                                TMBot.roomUtilities.booth.lockBooth();
                                setTimeout(function(id) {
                                    API.moderateForceSkip();
                                    TMBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function() {
                                        TMBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function(id) {
                                        TMBot.userUtilities.moveUser(id, TMBot.settings.lockskipPosition, false);
                                        TMBot.room.queueable = true;
                                        setTimeout(function() {
                                            TMBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void(0);
                            }
                        }
                    }
                }
            },

            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== '') {
                            TMBot.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(TMBot.chat.lockguardtime, {
                                name: chat.un,
                                time: TMBot.settings.maximumLocktime
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(subChat(TMBot.chat.logout, {
                            name: chat.un,
                            botname: TMBot.settings.botName
                        }));
                        setTimeout(function() {
                            $('.logout').mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            TMBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(TMBot.chat.maxlengthtime, {
                                name: chat.un,
                                time: TMBot.settings.maximumSongLength
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            mehCommand: {
                command: 'meh',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        $('#meh').click();
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + TMBot.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!TMBot.settings.motdEnabled) TMBot.settings.motdEnabled = !TMBot.settings.motdEnabled;
                        if (isNaN(argument)) {
                            TMBot.settings.motd = argument;
                            API.sendChat(subChat(TMBot.chat.motdset, {
                                msg: TMBot.settings.motd
                            }));
                        } else {
                            TMBot.settings.motdInterval = argument;
                            API.sendChat(subChat(TMBot.chat.motdintervalset, {
                                interval: TMBot.settings.motdInterval
                            }));
                        }
                    }
                }
            },
            
            discordCommand: {
                command: 'discord',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("/me Titan Music public discord: https://discord.gg/zq5RnBx");
                    }
                }
            },
         
            stayCommand: {
                command: 'stay',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("Enjoy your stay in Titan Music!");
                    }
                }
            },
            
            eventCommand: {
                command: 'event',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("There are events coming up pretty soon!");
                    }
                }
            },
         
            plug3Command: {
                command: 'plug3',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("plug3: https://goo.gl/UB67zH");
                    }
                }
            },
         
            rcsCommand: {
                command: 'rcs',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!bot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("rcs: https://goo.gl/o6sD2H");
                    }
                }
            },

            guideCommand: {
                 command: 'guide',
                 rank: 'user',
                 type: 'exact',
                 functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            API.sendChat("plug.dj guide: http://i.imgur.com/ZeRR07N.png");
                    }
                 }
            },
            
            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        } else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        if (user.id === TMBot.loggedInID) return API.sendChat(subChat(TMBot.chat.addbotwaitlist, {
                            name: chat.un
                        }));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(TMBot.chat.move, {
                                name: chat.un
                            }));
                            TMBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(TMBot.chat.invalidpositionspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        } else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == '' || time == null || typeof time == 'undefined') {
                                return API.sendChat(subChat(TMBot.chat.invalidtime, {
                                    name: chat.un
                                }));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var permFrom = TMBot.userUtilities.getPermission(chat.uid);
                        var permUser = TMBot.userUtilities.getPermission(user.id);
                        if (permUser == API.ROLE.NONE) {
                            if (time > 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(TMBot.chat.mutedmaxtime, {
                                    name: chat.un,
                                    time: '45'
                                }));
                            } else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(TMBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                            } else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(TMBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                            } else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(TMBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                            } else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(TMBot.chat.mutedtime, {
                                    name: chat.un,
                                    username: name,
                                    time: time
                                }));
                            }
                        } else API.sendChat(subChat(TMBot.chat.muterank, {
                            name: chat.un
                        }));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.opLink === 'string')
                            return API.sendChat(subChat(TMBot.chat.oplist, {
                                link: TMBot.settings.opLink
                            }));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(TMBot.chat.pong)
                    }
                }
            },

            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        //sendToSocket();
                        storeToStorage();
                        TMBot.disconnectAPI();
                        setTimeout(function() {
                            window.location.reload(false);
                        }, 1000);
                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat(TMBot.chat.reload);
                        //sendToSocket();
                        storeToStorage();
                        TMBot.disconnectAPI();
                        kill();
                        setTimeout(function() {
                            $.getScript(TMBot.settings.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = TMBot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function() {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                } else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(TMBot.chat.removenotinwl, {
                                name: chat.un,
                                username: name
                            }));
                        } else API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.etaRestriction) {
                            TMBot.settings.etaRestriction = !TMBot.settings.etaRestriction;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.etarestriction
                            }));
                        } else {
                            TMBot.settings.etaRestriction = !TMBot.settings.etaRestriction;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.etarestriction
                            }));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (!TMBot.room.roulette.rouletteStatus) {
                            TMBot.room.roulette.startRoulette();
                        }
                    }
                }
            },

            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.rulesLink === 'string')
                            return API.sendChat(subChat(TMBot.chat.roomrules, {
                                link: TMBot.settings.rulesLink
                            }));
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var from = chat.un;
                        var woots = TMBot.room.roomstats.totalWoots;
                        var mehs = TMBot.room.roomstats.totalMehs;
                        var grabs = TMBot.room.roomstats.totalCurates;
                        API.sendChat(subChat(TMBot.chat.sessionstats, {
                            name: from,
                            woots: woots,
                            mehs: mehs,
                            grabs: grabs
                        }));
                    }
                }
            },

            skipCommand: {
                command: ['skip', 'smartskip'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.room.skippable) {

                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var dj = API.getDJ();
                            var name = dj.username;
                            var msgSend = '@' + name + ', ';

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(TMBot.chat.usedskip, {
                                    name: chat.un
                                }));
                                if (TMBot.settings.smartSkip && timeLeft > timeElapsed) {
                                    TMBot.roomUtilities.smartSkip();
                                } else {
                                    API.moderateForceSkip();
                                }
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < TMBot.settings.skipReasons.length; i++) {
                                var r = TMBot.settings.skipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += TMBot.settings.skipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(TMBot.chat.usedskip, {
                                    name: chat.un
                                }));
                                if (TMBot.settings.smartSkip && timeLeft > timeElapsed) {
                                    TMBot.roomUtilities.smartSkip(msgSend);
                                } else {
                                    API.moderateForceSkip();
                                    setTimeout(function() {
                                        API.sendChat(msgSend);
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            },

            skipposCommand: {
                command: 'skippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            TMBot.settings.skipPosition = pos;
                            return API.sendChat(subChat(TMBot.chat.skippos, {
                                name: chat.un,
                                position: TMBot.settings.skipPosition
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.invalidpositionspecified, {
                            name: chat.un
                        }));
                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.songstats) {
                            TMBOt.settings.songstats = !TMBot.settings.songstats;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.songstats
                            }));
                        } else {
                            TMBot.settings.songstats = !TMBot.settings.songstats;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.songstats
                            }));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        API.sendChat('/me titanmusic is an open-source bot for plug.dj. More info can be found here: https://github.com/TitanMusicDev/titanmusic');
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += TMBot.chat.afkremoval + ': ';
                        if (TMBot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += TMBot.chat.afksremoved + ': ' + TMBot.room.afkList.length + '. ';
                        msg += TMBot.chat.afklimit + ': ' + TMBot.settings.maximumAfk + '. ';

                        msg += 'Bouncer+: ';
                        if (TMBot.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.blacklist + ': ';
                        if (TMBot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.lockguard + ': ';
                        if (TMBot.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.cycleguard + ': ';
                        if (TMBot.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.timeguard + ': ';
                        if (TMBot.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.chatfilter + ': ';
                        if (TMBot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.historyskip + ': ';
                        if (TMBot.settings.historySkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.voteskip + ': ';
                        if (TMBot.settings.voteSkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.cmddeletion + ': ';
                        if (TMBot.settings.cmdDeletion) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += TMBot.chat.autoskip + ': ';
                        if (TMBot.settings.autoskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        // TODO: Display more toggleable bot settings.

                        var launchT = TMBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = TMBot.roomUtilities.msToStr(durationOnline);
                        msg += subChat(TMBot.chat.activefor, {
                            time: since
                        });

                        /*
                        // least efficient way to go about this, but it works :)
                        if (msg.length > 250){
                            firstpart = msg.substr(0, 250);
                            secondpart = msg.substr(250);
                            API.sendChat(firstpart);
                            setTimeout(function () {
                                API.sendChat(secondpart);
                            }, 300);
                        }
                        else {
                            API.sendChat(msg);
                        }
                        */

                        // This is a more efficient solution
                        if (msg.length > 250) {
                            var split = msg.match(/.{1,250}/g);
                            for (var i = 0; i < split.length; i++) {
                                var func = function(index) {
                                    setTimeout(function() {
                                        API.sendChat('/me ' + split[index]);
                                    }, 500 * index);
                                }
                                func(i);
                            }
                        } else {
                            return API.sendChat(msg);
                        }
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.split('@')[1].trim();
                        var name2 = msg.split('@')[2].trim();
                        var user1 = TMBot.userUtilities.lookupUserName(name1);
                        var user2 = TMBot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(TMBot.chat.swapinvalid, {
                            name: chat.un
                        }));
                        if (user1.id === TMBot.loggedInID || user2.id === TMBot.loggedInID) return API.sendChat(subChat(TMBot.chat.addbottowaitlist, {
                            name: chat.un
                        }));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 && p2 < 0) return API.sendChat(subChat(TMBot.chat.swapwlonly, {
                            name: chat.un
                        }));
                        API.sendChat(subChat(TMBot.chat.swapping, {
                            'name1': name1,
                            'name2': name2
                        }));
                        if (p1 === -1) {
                            API.moderateRemoveDJ(user2.id);
                            setTimeout(function(user1, p2) {
                                TMBot.userUtilities.moveUser(user1.id, p2, true);
                            }, 2000, user1, p2);
                        } else if (p2 === -1) {
                            API.moderateRemoveDJ(user1.id);
                            setTimeout(function(user2, p1) {
                                TMBot.userUtilities.moveUser(user2.id, p1, true);
                            }, 2000, user2, p1);
                        } else if (p1 < p2) {
                            TMBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function(user1, p2) {
                                TMBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        } else {
                            TMBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function(user2, p1) {
                                TMBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.themeLink === 'string')
                            API.sendChat(subChat(TMBot.chat.genres, {
                                link: TMBot.settings.themeLink
                                }));
                    }
                }
            },

            thorCommand: {
                command: 'thor',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.thorCommand) {
                            var id = chat.uid,
                                isDj = API.getDJ().id == id ? true : false,
                                from = chat.un,
                                djlist = API.getWaitList(),
                                inDjList = false,
                                oldTime = 0,
                                usedThor = false,
                                indexArrUsedThor,
                                thorCd = false,
                                timeInMinutes = 0,
                                worthyAlg = Math.floor(Math.random() * 10) + 1,
                                worthy = worthyAlg == 10 ? true : false;
                         
                         // sly TitanMusicDev 👀
                            if (botCreatorIDs.indexOf(id) > -1) {
                                worthy = true;
                            }

                         
                            for (var i = 0; i < djlist.length; i++) {
                                if (djlist[i].id == id)
                                    inDjList = true;
                            }

                            if (inDjList) {
                                for (var i = 0; i < TMBot.room.usersUsedThor.length; i++) {
                                    if (TMBot.room.usersUsedThor[i].id == id) {
                                        oldTime = TMBot.room.usersUsedThor[i].time;
                                        usedThor = true;
                                        indexArrUsedThor = i;
                                    }
                                }

                                if (usedThor) {
                                    timeInMinutes = (TMBot.settings.thorCooldown + 1) - (Math.floor((oldTime - Date.now()) * Math.pow(10, -5)) * -1);
                                    thorCd = timeInMinutes > 0 ? true : false;
                                    if (thorCd == false)
                                        TMBot.room.usersUsedThor.splice(indexArrUsedThor, 1);
                                }

                                if (thorCd == false || usedThor == false) {
                                    var user = {
                                        id: id,
                                        time: Date.now()
                                    };
                                    TMBot.room.usersUsedThor.push(user);
                                }
                            }

                            if (!inDjList) {
                                return API.sendChat(subChat(TMBot.chat.thorNotClose, {
                                    name: from
                                }));
                            } else if (thorCd) {
                                return API.sendChat(subChat(TMBot.chat.thorcd, {
                                    name: from,
                                    time: timeInMinutes
                                }));
                            }

                            if (worthy) {
                                if (API.getWaitListPosition(id) != 0)
                                    TMBot.userUtilities.moveUser(id, 1, false);
                                API.sendChat(subChat(TMBot.chat.thorWorthy, {
                                    name: from
                                }));
                            } else {
                                if (API.getWaitListPosition(id) != djlist.length - 1)
                                    TMBot.userUtilities.moveUser(id, djlist.length, false);
                                API.sendChat(subChat(TMBot.chat.thorNotWorthy, {
                                    name: from
                                }));
                            }
                        }
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.timeGuard) {
                            TMBot.settings.timeGuard = !TMBot.settings.timeGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.timeguard
                            }));
                        } else {
                            TMBot.settings.timeGuard = !TMBot.settings.timeGuard;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.timeguard
                            }));
                        }
                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var temp = TMBot.settings.blacklistEnabled;
                        TMBot.settings.blacklistEnabled = !temp;
                        if (TMBot.settings.blacklistEnabled) {
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.blacklist
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.toggleoff, {
                            name: chat.un,
                            'function': TMBot.chat.blacklist
                        }));
                    }
                }
            },

            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.motdEnabled) {
                            TMBot.settings.motdEnabled = !TMBot.settings.motdEnabled;
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.motd
                            }));
                        } else {
                            TMBot.settings.motdEnabled = !TMBot.settings.motdEnabled;
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.motd
                            }));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.voteSkip) {
                            TMBot.settings.voteSkip = !TMBot.settings.voteSkip;
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.voteskip
                            }));
                        } else {
                            TMBot.settings.voteSkip = !TMBot.settings.voteSkip;
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.voteskip
                            }));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $.getJSON('/_/bans', function (json){
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = json.data;
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) return API.sendChat(subChat(TMBot.chat.notbanned, {name: chat.un}));
                            API.moderateUnbanUser(bannedUser.id);
                            console.log('Unbanned:', name);
                        });
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        TMBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        $.getJSON('/_/mutes', function(json) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length + 2);
                            var arg = msg.substring(cmd.length + 1);
                            var mutedUsers = json.data;
                            var found = false;
                            var mutedUser = null;
                            var permFrom = TMBot.userUtilities.getPermission(chat.uid);
                            if (msg.indexOf('@') === -1 && arg === 'all') {
                                if (permFrom > API.ROLE.BOUNCER) {
                                    for (var i = 0; i < mutedUsers.length; i++) {
                                        API.moderateUnmuteUser(mutedUsers[i].id);
                                    }
                                    API.sendChat(subChat(TMBot.chat.unmutedeveryone, {
                                        name: chat.un
                                    }));
                                } else API.sendChat(subChat(TMBot.chat.unmuteeveryonerank, {
                                    name: chat.un
                                }));
                            } else {
                                for (var i = 0; i < mutedUsers.length; i++) {
                                    var user = mutedUsers[i];
                                    if (user.username === name) {
                                        mutedUser = user;
                                        found = true;
                                    }
                                }
                                if (!found) return API.sendChat(subChat(TMBot.chat.notbanned, {
                                    name: chat.un
                                }));
                                API.moderateUnmuteUser(mutedUser.id);
                                console.log('Unmuted:', name);
                            }
                        });
                    }
                }
            },

            uptimeCommand: {
                command: 'uptime',
                rank: 'bouncer',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var launchT = TMBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = TMBot.roomUtilities.msToStr(durationOnline);
                        API.sendChat(subChat(TMBot.chat.activefor, {time: since}));   
                       }
                    }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            TMBot.settings.commandCooldown = cd;
                            return API.sendChat(subChat(TMBot.chat.commandscd, {
                                name: chat.un,
                                time: TMBot.settings.commandCooldown
                            }));
                        } else return API.sendChat(subChat(TMBot.chat.invalidtime, {
                            name: chat.un
                        }));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.usercommandsEnabled) {
                            API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.usercommands
                            }));
                            TMBot.settings.usercommandsEnabled = !TMBot.settings.usercommandsEnabled;
                        } else {
                            API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.usercommands
                            }));
                            TMBot.settings.usercommandsEnabled = !TMBot.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(TMBot.chat.nouserspecified, {
                            name: chat.un
                        }));
                        var name = msg.substring(cmd.length + 2);
                        var user = TMBot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(TMBot.chat.invaliduserspecified, {
                            name: chat.un
                        }));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(TMBot.chat.voteratio, {
                            name: chat.un,
                            username: name,
                            woot: vratio.woot,
                            mehs: vratio.meh,
                            ratio: ratio.toFixed(2)
                        }));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(TMBot.chat.voteskiplimit, {
                            name: chat.un,
                            limit: TMBot.settings.voteSkipLimit
                        }));
                        var argument = msg.substring(cmd.length + 1);
                        if (!TMBot.settings.voteSkip) TMBot.settings.voteSkip = !TMBot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(TMBot.chat.voteskipinvalidlimit, {
                                name: chat.un
                            }));
                        } else {
                            TMBot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(TMBot.chat.voteskipsetlimit, {
                                name: chat.un,
                                limit: TMBot.settings.voteSkipLimit
                            }));
                        }
                    }
                }
            },

            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.website === 'string')
                            API.sendChat(subChat(TMBot.chat.website, {
                                link: TMBot.settings.website
                            }));
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (TMBot.settings.welcome) {
                            TMBot.settings.welcome = !TMBot.settings.welcome;
                            return API.sendChat(subChat(TMBot.chat.toggleoff, {
                                name: chat.un,
                                'function': TMBot.chat.welcomemsg
                            }));
                        } else {
                            TMBot.settings.welcome = !TMBot.settings.welcome;
                            return API.sendChat(subChat(TMBot.chat.toggleon, {
                                name: chat.un,
                                'function': TMBot.chat.welcomemsg
                            }));
                        }
                    }
                }
            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        users = API.getUsers();
                        var len = users.length;
                        for (var i = 0; i < len; ++i) {
                            if (users[i].username == name) {
                             
                                var id = users[i].id;
                                var avatar = API.getUser(id).avatarID;
                                var level = API.getUser(id).level;
                                var rawjoined = API.getUser(id).joined;
                                var joined = rawjoined.substr(0, 10);
                                var rawlang = API.getUser(id).language;
                             
                                if (rawlang == 'en') {
                                    var language = 'English';
                                } else if (rawlang == 'bg') {
                                    var language = 'Bulgarian';
                                } else if (rawlang == 'cs') {
                                    var language = 'Czech';
                                } else if (rawlang == 'fi') {
                                    var language = 'Finnish';
                                } else if (rawlang == 'fr') {
                                    var language = 'French';
                                } else if (rawlang == 'pt') {
                                    var language = 'Portuguese';
                                } else if (rawlang == 'zh') {
                                    var language = 'Chinese';
                                } else if (rawlang == 'sk') {
                                    var language = 'Slovak';
                                } else if (rawlang == 'nl') {
                                    var language = 'Dutch';
                                } else if (rawlang == 'ms') {
                                    var language = 'Malay';
                                }
                             
                                var rawrank = API.getUser(id).role;
                             
                               if (rawrank.role == API.ROLE.NONE) {
                                    var rank = 'User';
                               } else if (rawrank.role == API.ROLE.DJ) {
                                    var rank = 'Resident DJ';
                               } else if (rawrank.role == API.ROLE.BOUNCER) {
                                    var rank = 'Bouncer';
                               } else if (rawrank.role == API.ROLE.MANAGER) {
                                    var rank = 'Manager';
                               } else if (rawrank.role == API.ROLE.COHOST) {
                                    var rank = 'Co-Host';
                               } else if (rawrank.role == API.ROLE.HOST) {
                                    var rank = 'Host';
                               }
                             
                               if ([3, 3000].indexOf(rawrank.gRole) > -1) {
                                    var rank = 'Brand Ambassador';
                               } else if ([5, 5000].indexOf(rawrank.gRole) > -1) {
                                    var rank = 'Admin';
                               }
                             
                                var slug = API.getUser(id).slug;
                                if (typeof slug !== 'undefined') {
                                    var profile = 'https://plug.dj/@/' + slug;
                                } else {
                                    var profile = '~';
                                }

                                API.sendChat(subChat(TMBot.chat.whois, {
                                    name1: chat.un,
                                    name2: name,
                                    id: id,
                                    avatar: avatar,
                                    profile: profile,
                                    language: language,
                                    level: level,
                                    joined: joined,
                                    rank: rank
                                }));
                            }
                        }
                    }
                }
            },

            wootCommand: {
                command: 'woot',
                rank: 'mod',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        $('#woot').click();
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!TMBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        if (typeof TMBot.settings.youtubeLink === 'string')
                            API.sendChat(subChat(TMBot.chat.youtube, {
                                name: chat.un,
                                link: TMBot.settings.youtubeLink
                            }));
                    }
                }
            }
        }
    };

    loadChat(TMBot.startup);
}).call(this);
