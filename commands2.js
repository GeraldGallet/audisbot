const commands = [
    {
        "title": "global",
        "description": "Used to interact with my state",
        "commands": [
            {
                "command": "list",
                "description": "List all commands"
            },
            {
                "command": "files",
                "description": "List all mp3 files"
            },
            {
                "command": "queue",
                "description": "Show the current queue"
            },
            {
                "command": "info",
                "description": "Get informations about my current state"
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
                "command": "stop",
                "description": "Kick me from your channel"
            },
            {
                "command": "addvocal",
                "description": "Add a voice command",
                "help": "Usage: addvocal <command name> <'link'|'mp3'> <filename (with '.mp3') | youtube link> (<description>)"
            },
            {
                "command": "download",
                "description": "Download a youtube video",
                "help": "Usage: download <link> <filename> (<start in seconds> <end in seconds>)"
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
                "command": "happy",
                "description": "We are happy !",
                "type": "mp3",
                "audio": "happy.mp3"
            },
            {
                "command": "sheh",
                "description": "You've got the seum",
                "type": "link",
                "audio": "https://www.youtube.com/watch?v=9M2Ce50Hle8"
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
            }
        ]
    }
]