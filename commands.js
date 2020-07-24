const commands = [
    {
        "title": "global",
        "description": "Used to interact with my state",
        "commands": [
            {
                "command": "addvocal",
                "description": "Add a voice command",
                "help": "Usage: addvocal <command name> <'link'|'mp3'> <filename (with '.mp3') | youtube link> (<description>)"
            },
            {
                "command": "config",
                "description": "List my configurations"
            },
            {
                "command": "download",
                "description": "Download a youtube video",
                "help": "Usage: download <link> <filename> (<start in seconds> <end in seconds>)"
            },
            {
                "command": "files",
                "description": "List all mp3 files"
            },
            {
                "command": "list",
                "description": "List all commands"
            },
            {
                "command": "pause",
                "description": "Pause me in your channel"
            },
            {
                "command": "resume",
                "description": "Resume the playing in your channel"
            },
            {
                "command": "setvocal",
                "description": "Set an option of a vocal command",
                "help": "Usage: !setvocal <option> <value>\nAvailable options: description | volume"
            },
            {
                "command": "stop",
                "description": "Kick me from your channel"
            },
            {
                "command": "toggle",
                "description": "Toggle a boolean in my configuration",
                "help": "Usage: toggle <'welcome'>"
            }
        ]
    },
    {
        "title": "text",
        "description": "Everything is textual with these commands",
        "commands": [
            {
                "command": "ping",
                "description": "Replies pong"
            }
        ]
    },
    {
        "title": "voice",
        "description": "These commands will summon me and make me tell you a little something",
        "commands": [
            {
                "command": "allo",
                "description": "We are not des sauvages",
                "type": "mp3",
                "audio": "allo.mp3"
            },
            {
                "command": "happy",
                "description": "We are happy !",
                "type": "mp3",
                "audio": "happy.mp3"
            },
            {
                "command": "lisala2000",
                "description": "C'te catin des bois",
                "type": "link",
                "audio": "https://www.youtube.com/watch?v=WTAc0eZs444"
            },
            {
                "command": "lamarelle",
                "description": "No description here",
                "type": "mp3",
                "audio": "lamarelle.mp3"
            },
            {
                "command": "tropdesel",
                "description": "No description here",
                "type": "link",
                "audio": "https://www.youtube.com/watch?v=a5H8mTrIye8"
            },
            {
                "command": "sheh",
                "description": "No description here",
                "type": "mp3",
                "audio": "sheh.mp3"
            },
            {
                "command": "jaune",
                "description": "Comme un Ricard ",
                "type": "mp3",
                "audio": "jaune.mp3",
                "volume": "1.5 "
            },
            {
                "command": "bebe",
                "description": "No description here",
                "type": "mp3",
                "audio": "bebe.mp3",
                "volume": "1 "
            },
            {
                "command": "chocho",
                "description": "No description here",
                "type": "mp3",
                "audio": "chocho.mp3",
                "volume": "1.5 "
            }
        ]
    }
];

module.exports = commands;