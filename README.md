## RUNNING WITH DOCKER
- `cd chatapp`
- install docker and docker-compose
- docker-compose up

## RUNNING BARE METAL
- `cd chatapp`
- install Deno - `brew install deno`
- `cd backend && deno task dev`
- `npm i peer -g` (https://github.com/peers/peerjs-server)
- open another terminal and run `peerjs --proxied --port 3001`
- make sure to place nginx-sites-enabled.conf under "/etc/nginx/sites-enabled"
- `sudo service nginx start` to run nginx
