# Reticulum setup procedure

[RPI basic setup guide](http://www.circuitbasics.com/raspberry-pi-basics-setup-without-monitor-keyboard-headless-mode/)

## Tools

 * SDFormatter to format SD card
 * Win32DiskImager to Write Raspbian image to SD card

Use _Expand Filesystem_ option in `raspi-config` to cover entire SD after `ssh`-ing to Raspberry PI

## Installing dependencies

### Applications and libraries

```
sudo apt-get update

sudo apt-get install mysql-server
sudo apt-get install ruby-dev
sudo apt-get install libmysqlclient-dev
sudo apt-get install openssl
sudo apt-get install libssl-dev
```

### Ruby gems

Check Ruby Version

While installing gems if problem `bad response Service Unavailable 503` arises use http instead if https as gem source:

```
gem sources --remove https://rubygems.org/
gem sources -a http://rubygems.org/
```

**Note:** Make sure to install `faye-websocket` version 0.8.0, since newer versions make problems for determining client IP and PORT for websocket connections.

#### Installing ruby gems using bundler

```
sudo gem install bundler
```

And run

```
bundle install
```

**Note:** In case of `Cannot allocate memory` error try the bellow method of installing gems. On some VPS providers bundler can't get enough memory to install all gems concurrently.

#### Installing ruby gems by hand

```
gem install bundler
gem install rack:1.6.0
gem install eventmachine:1.0.4
gem install faye-websocket:0.8.0

gem install thin:1.6.3
gem install mysql2:0.4.2
```

## Get Reticulum source files

Copy or `git clone` the Reticulum project

**Note:** Make sure that the proxy folder name matches the name in run.sh

If needed run:

```
chmod +x run.sh
```

## Database setup

```sql
CREATE DATABASE reticulum;

use reticulum;

CREATE TABLE user (
    id INT AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(250) NOT NULL,
    PRIMARY KEY(id)
);
```
