# eb-healthd-middleware

When running Elastic Beanstalk in multi-container Docker mode the very 
useful enhanced health reporting does not work out of the box. There are 
several steps to configure it correctly and unfortunately they are not
located in one document. Specifically, it requires one's application to 
log information about requests in a [particular format and location][1].

This repo will detail those steps and provide Node.js middleware for 
[Restify](http://restify.com/) and [Express](http://expressjs.com/) to 
aid in logging appropriately.

## Install

`npm install eb-healthd-middleware --save`

## Setup

The first step is to create an `.ebextensions` folder that is uploaded
in the same zip archive as your `Dockerrun.aws.json` file. Place the
following yaml file (named `01-nginx-healthd.config`) in `.ebextensions` 
ensuring the placeholder is replaced with the name of the container to 
be monitored. This informs the health monitoring agent as to where to 
find the logs on the host and also sets up a Cron job to periodically 
delete rotated logs.

```yaml
files:
    "/etc/cron.hourly/cron.logcleanup.elasticbeanstalk.healthd.nginx.conf":
        mode: "000755"
        owner: root
        group: root
        content: |
            #!/bin/sh
            find /var/log/containers/<YOURCONTAINERNAME>/healthd -type f | grep -v application.log.`date -u +"%Y-%m-%d-%H"` | xargs rm -f
    "/home/ec2-user/setup-healthd-appstat.sh":
        mode: "000755"
        owner: root
        group: root
        content: |
            #!/bin/sh
            set -e
            mkdir -p /var/log/containers/<YOURCONTAINERNAME>/healthd
            chmod 777 /var/log/containers/<YOURCONTAINERNAME>/healthd
            if [ -d "/etc/healthd" ]
            then
                echo "appstat_log_path: /var/log/containers/<YOURCONTAINERNAME>/healthd/application.log" >> /etc/healthd/config.yaml
                echo "appstat_unit: sec" >> /etc/healthd/config.yaml
                echo "appstat_timestamp_on: completion" >> /etc/healthd/config.yaml
                initctl start healthd || initctl restart healthd
            fi

container_commands:
    01-healthd-configure:
        command: /home/ec2-user/setup-healthd-appstat.sh 
```

Once the host's logging location has been created we create mount points
for the Docker container. The default logging location is usually
`/var/log/nginx` but is configurable. One must edit the
`Dockerrun.aws.json` to do so (note that the `awseb-logs` source volume
is a preconfigured Elastic Beanstalk volume):

```json
{
  "AWSEBDockerrunVersion": "2",
  "containerDefinitions": [{
    "name": "<YOURCONTAINERNAME>",
    "image": "mydocker/image:latest",
    "essential": "true",
    "memory": 1700,
    "portMappings": [{
      "hostPort": "80",
      "containerPort": "8080"
    }],
    "mountPoints": [
      {
        "sourceVolume": "awseb-logs-<YOURCONTAINERNAME>",
        "containerPath": "<LOGLOCATION>"
      }
    ]
  }]
}
```

Finally, one must log the requests as they come into the server. To do 
so we assign some simple middleware to log these in a file of the format
`/my/log/dir/application.log.yyyy-MM-dd-hh`. Ensure that the log
directory specified has been created in the `Dockerfile`.

For example, using Restify:

```js
const restify = require('restify');
const ebHealth = require('eb-healthd-middleware');

const server = restify.createServer({
    name: 'myApi'
});
    
server.use(ebHealth({directory: '/my/log/dir'}));
```

Or with Express:

```js
const express = require('express');
const ebHealth = require('eb-healthd-middleware');

const app = express();

// passing an empty options object will result in a default logging 
// directory of /var/log/nginx/healthd being used
app.use(ebHealth({}));
```

[1]: http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/health-enhanced-serverlogs.html
