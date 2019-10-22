@ECHO OFF
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "RendogTV Bot" /min "%~dpnx0" %* && exit
node bot.js
ECHO Bot has stopped!
exit