#!/usr/bin/env python3
"""
noizy_cli.py - NOIZY Sovereign Runtime CLI
Commands:
  noizy mission replay <fixture.json>
  noizy policy explain <decision_id>
  noizy receipt verify <receipt_id>
  noizy mission rollback <mission_id>
"""

import sys
import os
import json
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.sovereign_runtime.mission_simulator import MissionSimulator


def main():
    parser = argparse.ArgumentParser(description="NOIZY Sovereign Runtime Command-Line Interface")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. Mission Subparser
    mission_parser = subparsers.add_parser("mission", help="Mission lifecycle controls")
    mission_sub = mission_parser.add_subparsers(dest="mission_action", required=True)
    
    # noizy mission replay <fixture>
    replay_parser = mission_sub.add_parser("replay", help="Replay mission dry-run simulation")
    replay_parser.add_argument("fixture", help="Path to mission fixture JSON")

    # noizy mission rollback <mission_id>
    rollback_parser = mission_sub.add_parser("rollback", help="Rollback mission")
    rollback_parser.add_argument("mission_id", help="Mission ID")

    # 2. Policy Subparser
    policy_parser = subparsers.add_parser("policy", help="Policy evaluation & counterfactuals")
    policy_sub = policy_parser.add_subparsers(dest="policy_action", required=True)
    
    # noizy policy explain <decision_id>
    explain_parser = policy_sub.add_parser("explain", help="Generate counterfactual explanation")
    explain_parser.add_argument("decision_id", help="Decision Packet ID")

    # 3. Receipt Subparser
    receipt_parser = subparsers.add_parser("receipt", help="Harmony receipt audit & verification")
    receipt_sub = receipt_parser.add_subparsers(dest="receipt_action", required=True)
    
    # noizy receipt verify <receipt_id>
    verify_parser = receipt_sub.add_parser("verify", help="Verify receipt hash and state")
    verify_parser.add_argument("receipt_id", help="Receipt ID")

    args = parser.parse_args()
    sim = MissionSimulator(sovereign_authority="RSP_001")

    if args.command == "mission":
        if args.mission_action == "replay":
            res = sim.replay_mission(args.fixture)
            print(json.dumps(res, indent=2))
        elif args.mission_action == "rollback":
            res = sim.rollback_mission(args.mission_id)
            print(json.dumps(res, indent=2))

    elif args.command == "policy":
        if args.policy_action == "explain":
            res = sim.explain_policy(args.decision_id)
            print(json.dumps(res, indent=2))

    elif args.command == "receipt":
        if args.receipt_action == "verify":
            res = sim.verify_receipt(args.receipt_id)
            print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
