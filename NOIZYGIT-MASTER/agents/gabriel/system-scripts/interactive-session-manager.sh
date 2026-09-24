#!/bin/zsh
# NOIZYLAB Interactive Session Manager
# Real-time collaboration between M2Ultra and HP-OMEN

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# MAIN MENU
# ============================================================================

show_menu() {
    clear
    echo -e "${CYAN}🎮 NOIZYLAB Interactive Session Manager${NC}"
    echo -e "${CYAN}=======================================${NC}"
    echo ""
    echo "  1. 📡 Start Interactive Session"
    echo "  2. 👁️  Screen Sharing"
    echo "  3. ⌨️  Terminal Sharing"
    echo "  4. 📁 File Transfer"
    echo "  5. 💬 Chat & Notifications"
    echo "  6. 🌐 Web Dashboard"
    echo "  7. 📊 System Monitor"
    echo "  8. 🔧 Configuration"
    echo "  9. ❌ Exit"
    echo ""
    read -p "Select option (1-9): " choice
}

# ============================================================================
# 1. START INTERACTIVE SESSION
# ============================================================================

start_session() {
    echo -e "\n${BLUE}📡 Starting Interactive Session${NC}"
    
    read -p "Session name (default: main): " session_name
    session_name=${session_name:-main}
    
    # Check if session exists
    if tmux has-session -t "$session_name" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Session '$session_name' already exists${NC}"
        read -p "Attach to existing? (y/n): " attach
        if [ "$attach" = "y" ]; then
            tmux attach-session -t "$session_name"
        fi
    else
        echo "🚀 Creating session: $session_name"
        tmux new-session -d -s "$session_name" -c "$HOME"
        echo -e "${GREEN}✅ Session created${NC}"
        
        # Share info
        IP=$(ipconfig getifaddr en0)
        echo ""
        echo -e "${CYAN}Share this command with remote user:${NC}"
        echo -e "${GREEN}ssh -t m2ultra@$IP 'tmux attach-session -t $session_name'${NC}"
        echo ""
        
        read -p "Attach now? (y/n): " attach_now
        if [ "$attach_now" = "y" ]; then
            tmux attach-session -t "$session_name"
        fi
    fi
}

# ============================================================================
# 2. SCREEN SHARING
# ============================================================================

screen_sharing() {
    echo -e "\n${BLUE}🖥️  Screen Sharing Options${NC}"
    echo ""
    echo "  1. VNC Screen Share"
    echo "  2. TeamViewer"
    echo "  3. Show Connection Details"
    echo ""
    read -p "Select (1-3): " screen_choice
    
    case $screen_choice in
        1)
            IP=$(ipconfig getifaddr en0)
            echo -e "${GREEN}VNC Connection:${NC}"
            echo "vnc://$IP:5900"
            echo ""
            echo "Or open with:"
            echo "open vnc://$IP"
            ;;
        2)
            echo "🎯 Launching TeamViewer..."
            open -a TeamViewer
            ;;
        3)
            show_connection_details
            ;;
    esac
}

# ============================================================================
# 3. TERMINAL SHARING
# ============================================================================

terminal_sharing() {
    echo -e "\n${BLUE}⌨️  Terminal Sharing Options${NC}"
    echo ""
    echo "  1. List Active Sessions"
    echo "  2. Create New Session"
    echo "  3. Share Session URL"
    echo "  4. Join Remote Terminal"
    echo ""
    read -p "Select (1-4): " term_choice
    
    case $term_choice in
        1)
            echo -e "${CYAN}Active TMUX Sessions:${NC}"
            tmux list-sessions
            ;;
        2)
            read -p "Session name: " sess_name
            tmux new-session -d -s "$sess_name"
            echo -e "${GREEN}✅ Session created: $sess_name${NC}"
            ;;
        3)
            IP=$(ipconfig getifaddr en0)
            read -p "Session name: " sess_name
            echo -e "${GREEN}Share this:${NC}"
            echo "ssh -t m2ultra@$IP 'tmux attach-session -t $sess_name'"
            ;;
        4)
            read -p "Remote IP/hostname: " remote_host
            read -p "Session name: " sess_name
            ssh -t "$remote_host" "tmux attach-session -t $sess_name"
            ;;
    esac
}

# ============================================================================
# 4. FILE TRANSFER
# ============================================================================

file_transfer() {
    echo -e "\n${BLUE}📁 File Transfer Options${NC}"
    echo ""
    echo "  1. Send File to HP-OMEN"
    echo "  2. Get File from HP-OMEN"
    echo "  3. Sync Folder (rsync)"
    echo "  4. Background Sync"
    echo ""
    read -p "Select (1-4): " file_choice
    
    case $file_choice in
        1)
            read -p "Local file path: " local_file
            read -p "Remote path: " remote_path
            read -p "Remote host (default: hp-omen): " remote_host
            remote_host=${remote_host:-hp-omen}
            scp "$local_file" "gabriel@$remote_host:$remote_path"
            echo -e "${GREEN}✅ File sent${NC}"
            ;;
        2)
            read -p "Remote file path: " remote_file
            read -p "Remote host (default: hp-omen): " remote_host
            remote_host=${remote_host:-hp-omen}
            read -p "Local destination (default: ~/Downloads): " local_dest
            local_dest=${local_dest:-~/Downloads}
            scp "gabriel@$remote_host:$remote_file" "$local_dest"
            echo -e "${GREEN}✅ File received${NC}"
            ;;
        3)
            read -p "Local folder: " local_folder
            read -p "Remote path: " remote_path
            read -p "Remote host (default: hp-omen): " remote_host
            remote_host=${remote_host:-hp-omen}
            rsync -avz --progress "$local_folder/" "gabriel@$remote_host:$remote_path/"
            echo -e "${GREEN}✅ Sync complete${NC}"
            ;;
        4)
            read -p "Folder to sync: " folder_to_sync
            read -p "Remote host: " remote_host
            echo "Starting background sync..."
            nohup bash -c "while true; do rsync -avz '$folder_to_sync/' 'gabriel@$remote_host:~/Sync/'; sleep 5; done" > /dev/null 2>&1 &
            echo -e "${GREEN}✅ Background sync started${NC}"
            ;;
    esac
}

# ============================================================================
# 5. CHAT & NOTIFICATIONS
# ============================================================================

chat_notifications() {
    echo -e "\n${BLUE}💬 Chat & Notifications${NC}"
    echo ""
    read -p "Enter message: " message
    
    # Log message
    mkdir -p ~/.noizylab/notifications
    echo "[$(date '+%H:%M:%S')] You: $message" >> ~/.noizylab/notifications/chat.log
    
    # Display notification
    osascript -e "display notification \"$message\" with title \"NOIZYLAB Chat\""
    
    # Try to send to remote
    read -p "Send to remote user? (y/n): " send_remote
    if [ "$send_remote" = "y" ]; then
        read -p "Remote host: " remote_host
        ssh "$remote_host" "osascript -e \"display notification \\\"$message\\\" with title \\\"NOIZYLAB from M2Ultra\\\"\""
        echo -e "${GREEN}✅ Notification sent${NC}"
    fi
}

# ============================================================================
# 6. WEB DASHBOARD
# ============================================================================

web_dashboard() {
    echo -e "\n${BLUE}🌐 Web Dashboard${NC}"
    echo ""
    read -p "Port (default: 8888): " port
    port=${port:-8888}
    
    echo "🚀 Starting dashboard at http://localhost:$port"
    sleep 2
    open "http://localhost:$port"
    
    cd ~/.noizylab/web
    python3 -m http.server "$port" --bind 127.0.0.1 2>/dev/null || python -m SimpleHTTPServer "$port"
}

# ============================================================================
# 7. SYSTEM MONITOR
# ============================================================================

system_monitor() {
    echo -e "\n${BLUE}📊 System Monitor${NC}"
    echo ""
    echo "M2Ultra Statistics:"
    echo "==================="
    echo "Uptime: $(uptime)"
    echo "CPU: $(sysctl -n hw.physicalcpu)"
    echo "Memory: $(vm_stat | grep "Pages free" | awk '{print $3}')"
    echo "Disk: $(df -h | grep -E '^/dev' | head -1 | awk '{print $5 " used, " $4 " free"}')"
    
    echo ""
    echo "Network:"
    echo "========"
    echo "IP: $(ipconfig getifaddr en0)"
    echo "SSH: $(sudo systemsetup -getremotelogin 2>/dev/null || echo 'N/A')"
    echo "Screen Sharing: $(pgrep -q ARDAgent && echo 'Running' || echo 'Stopped')"
}

# ============================================================================
# 8. CONFIGURATION
# ============================================================================

configuration() {
    echo -e "\n${BLUE}🔧 Configuration${NC}"
    echo ""
    echo "  1. Enable SSH"
    echo "  2. Enable Screen Sharing"
    echo "  3. Configure TMUX"
    echo "  4. Setup SSH Keys"
    echo "  5. Test Connections"
    echo ""
    read -p "Select (1-5): " config_choice
    
    case $config_choice in
        1)
            sudo systemsetup -setremotelogin on
            echo -e "${GREEN}✅ SSH enabled${NC}"
            ;;
        2)
            sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -activate -configure -access -on -users admin -privs -all -restart -agent -console
            echo -e "${GREEN}✅ Screen Sharing enabled${NC}"
            ;;
        3)
            nano ~/.tmux.conf
            ;;
        4)
            ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
            echo "Copy public key to remote:"
            cat ~/.ssh/id_ed25519.pub
            ;;
        5)
            echo "Testing SSH..."
            read -p "Remote host: " test_host
            ssh -o ConnectTimeout=5 "$test_host" "echo 'SSH OK'" && echo -e "${GREEN}✅ SSH works${NC}" || echo -e "${RED}❌ SSH failed${NC}"
            ;;
    esac
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

show_connection_details() {
    echo -e "\n${CYAN}📍 Connection Details${NC}"
    echo ""
    echo "Computer: $(scutil --get ComputerName)"
    echo "IP: $(ipconfig getifaddr en0)"
    echo "SSH: ssh m2ultra@$(ipconfig getifaddr en0)"
    echo "VNC: vnc://$(ipconfig getifaddr en0):5900"
    echo "TMUX: tmux attach-session -t main (if session exists)"
}

# ============================================================================
# MAIN LOOP
# ============================================================================

while true; do
    show_menu
    
    case $choice in
        1) start_session ;;
        2) screen_sharing ;;
        3) terminal_sharing ;;
        4) file_transfer ;;
        5) chat_notifications ;;
        6) web_dashboard ;;
        7) system_monitor ;;
        8) configuration ;;
        9) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    
    read -p "Press Enter to continue..."
done
