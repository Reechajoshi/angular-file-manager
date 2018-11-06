Run the express server 
node nodejs/app.js

login via http://localhost/bootswatch/app/index.html#/login with 3 test file in nodejs\test. All file just one line with username,password,theme. Login and change the theme will update the file. Relogin will load the theme the user last time selected.

Protrator test this with random theme select, passed.

angular-filemanager intergration(including most of function of original except compress and permission,bulk opration supported),directive will have initial-folder and theme as parameter

start angular-filemanager nodejs server  change bootswatch theme will update angular-filemanager theme as well.

Steps to run the app on c9.io(cloud server):  
1. go to directory nodejs run node app.js to start bootswatch server(which listen on 8080 port).  
2. go to directory app/js/directive/filemanager/nodejs run node app.js(which listen on 8081 port) to start file manager server.  
3. Two server set up here since these are two different project, fileManager supposed to be re-usable.  
4. Edit the config file in app/js/config.js and another is in app/js/directive/fileManager/app/js/providers/config.js to make sure service url is same with cloud server url and using the port 8080 and 8081 respectively.  
5. Also edit the socketUrl to match your server url using port 8082.  
6. Finally run npm install and bower install in app/js/directive/fileManager and gulp to generate the newest min file for angular-fileManager.  