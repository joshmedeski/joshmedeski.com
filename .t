#!/usr/bin/env bash
tmux split-window -v -p 30 d
tmux select-pane -t :.+
nvim +GoToFile
