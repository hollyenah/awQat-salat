```bashrc
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
tmux new-session -d -s awqat -m 'server' 'node awqat-salat/server.js'
sleep 3
termux-open-url http://localhost:3000
```