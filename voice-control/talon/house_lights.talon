app: terminal
-
house lights up: "cd /Users/m2ultra/THE-GATHERING && docker compose -f infrastructure/local/docker-compose.yml up -d\n"
house lights status: "cd /Users/m2ultra/THE-GATHERING && docker compose -f infrastructure/local/docker-compose.yml ps\n"
house lights sync: "cd /Users/m2ultra/THE-GATHERING && git status --short\n"
house lights gather: "cd /Users/m2ultra/THE-GATHERING && tmux list-windows -t noizy-skunkworks\n"
