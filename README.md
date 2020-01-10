# twitter_bot_node
Like in my other [repo](https://github.com/juantubello/twitter_bot), I develop the same bot but in this case it store data on firebase
instead of a google spreadsheet.

## Features

- **Not repeat**: The bot does not reply to a previously replied tweet

- **No duplicate tweets**: The bot has an index indicating which was the last quote tweeted to avoid duplicates

- **Log** : This bot use firebase to store quotes, replyed tweets and index of last quote.

- **Doesn't need much**: It's quite simple to implement this bot.

# Setup

- First you will need [node_js](https://nodejs.org/es/) , twitter [dev account](https://developer.twitter.com/en/apply-for-access) and a [firebase project](https://firebase.google.com/?hl=es)
- Then start a new project with ```npm init``` install dependencies with
   - ```npm install twit --save``` 
   - ```npm install firebase-admin --save``` 
   
  or ```clone``` this repo.
  
- Finally remember to:
  - In package.json remember to adjust this ```"start": "node yourFileName.js"``` with your file name.
  - Add your twitter and firebase credentials in modules
    - ```var twitterConfig = require('./twitterconfig');``` 
    - ```var admin = require('firebase-admin');```
  - Adjust twbot.js with ```databaseURL: 'https://yourDB.firebaseio.com/'``` and replace the parameter of 
    ```buscoTweets(@BotUsername)``` function with the specific type of tweet that you want to look for.
    
- If all done correctly, run ```npm start``` and you will have your bot running locally! 

    
   
