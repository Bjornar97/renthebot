@ECHO OFF
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "RendogTV Bot" /min "%~dpnx0" %* && exit
npm run start
ECHO Bot has stopped!
exit