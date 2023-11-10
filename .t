#!/usr/bin/env bash
tmux send-keys -t $1:1 'nvim +GoToFile' Enter
# PATH=$(tmux display-message -p -t $1 -F "#{pane_current_path}")
# tmux split-window -t $1:1 -v -p 30 -c $PATH
tmux split-window -t $1:1 -v -p 30 -c "#{session_path}"
tmux send-keys -t $1:1.1 'd' Enter
tmux select-pane -t $1:.+
