#!/bin/bash
sudo sysctl iogpu.wired_limit_mb=180000
sudo purge
rm -rf ~/Library/Caches/*
