# damour-bot

Provides custom server join/leave messages for Discord. That's it.

## Features

- Posts a random welcome message in #general when a user joins.
- Posts a random goodbye message in #general if a user leaves.
- Allows users to self assign color roles with the role prefix `color.`.

## Usage

### Welcome and goodbye messages

This thing runs on Node.js. You just need to do the `npm install` thing 
and then you can run it with `node app.js`.

Custom welcome and goodbye messages are defined in `welcomes.js` and 
`goodbyes.js` respectively. Custom messages must meet the following 
requirements:
1. The message is defined as a string.
2. The message contains one or many occurrences of the substring `"{user}"`. 
Each occurrence will be replaced with the user's username.

Here are some examples:
```js
"●●●{user} is typing..."
```
```js
"{user} FLEW TO JAPAN TO SING ABBA IN A BIG COLD RIVER"
```
```js
"Let's all give {user} a warm welcome!"
```

### Color management

View the list of available colors with `!colors`.

Use the command `!color <name>` to change colors.