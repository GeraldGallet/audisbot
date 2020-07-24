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
        "commands": []
    }
];

module.exports = commands;
