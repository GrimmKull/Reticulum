# thin start -R proxy/config.ru -p 7000
thin -d start -R proxy/config.ru -p 7000 -P tmp/pids/reticulum.pid -l logs/reticulum.log --ssl
