#!/usr/bin/env python3
"""
Zero-Knowledge Inclusion Proof Demo

Demonstrates how to prove membership in a Merkle tree without
revealing the entire dataset.

This is an educational example showing the standard Merkle inclusion
proof pattern that underpins more advanced ZK systems.

Usage:
    python3 zk_inclusion_demo.py

What this demonstrates:
    - A leaf can be proven to exist in a tree using only its sibling path
    - The verifier only needs the leaf, path, and root - not the full dataset
    - Any modification to the data changes the root, breaking verification
"""

import hashlib
import json
from typing import List, Tuple


def sha256(data: bytes) -> bytes:
    """Compute SHA-256 hash."""
    return hashlib.sha256(data).digest()


def sha256_hex(data: str) -> str:
    """Compute SHA-256 hash and return hex string."""
    return hashlib.sha256(data.encode()).hexdigest()


def build_merkle_tree(leaves: List[str]) -> Tuple[str, dict]:
    """
    Build a Merkle tree from leaf hashes.
    Returns (root_hash, tree_structure).
    """
    if not leaves:
        return "EMPTY", {}

    # Hash the leaves
    current_level = [sha256_hex(leaf) for leaf in leaves]
    tree = {"leaves": current_level.copy()}
    level_num = 0

    while len(current_level) > 1:
        # Pad to even length
        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        # Build next level
        next_level = []
        for i in range(0, len(current_level), 2):
            combined = current_level[i] + current_level[i + 1]
            parent = sha256_hex(combined)
            next_level.append(parent)

        tree[f"level_{level_num}"] = next_level.copy()
        current_level = next_level
        level_num += 1

    return current_level[0], tree


def generate_inclusion_proof(leaf: str, leaves: List[str]) -> List[Tuple[str, bool]]:
    """
    Generate a Merkle inclusion proof for a leaf.
    Returns a list of (sibling_hash, is_left) tuples.
    """
    if leaf not in leaves:
        raise ValueError("Leaf not in tree")

    proof = []
    current_level = [sha256_hex(l) for l in leaves]
    leaf_hash = sha256_hex(leaf)
    idx = current_level.index(leaf_hash)

    while len(current_level) > 1:
        # Pad to even length
        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        # Get sibling
        if idx % 2 == 0:
            sibling = current_level[idx + 1]
            is_left = False  # sibling is on the right
        else:
            sibling = current_level[idx - 1]
            is_left = True  # sibling is on the left

        proof.append((sibling, is_left))

        # Build next level
        next_level = []
        for i in range(0, len(current_level), 2):
            combined = current_level[i] + current_level[i + 1]
            next_level.append(sha256_hex(combined))

        idx = idx // 2
        current_level = next_level

    return proof


def verify_inclusion(leaf: str, proof: List[Tuple[str, bool]], root: str) -> bool:
    """
    Verify a Merkle inclusion proof.

    Args:
        leaf: The original leaf value
        proof: List of (sibling_hash, is_left) tuples
        root: Expected Merkle root

    Returns:
        True if the proof is valid
    """
    current_hash = sha256_hex(leaf)

    for sibling, is_left in proof:
        if is_left:
            combined = sibling + current_hash
        else:
            combined = current_hash + sibling
        current_hash = sha256_hex(combined)

    return current_hash == root


def main():
    print("=" * 60)
    print("NOIZY Zero-Knowledge Inclusion Proof Demo")
    print("=" * 60)
    print()

    # Example audit events
    audit_events = [
        "CONSENT_UPDATED:2026-04-06T10:00:00Z",
        "FREEZE_TRIGGERED:2026-04-06T11:00:00Z",
        "FREEZE_RESOLVED:2026-04-06T12:00:00Z",
        "PROMOTION_APPROVED:2026-04-06T13:00:00Z",
        "TOKEN_ISSUED:2026-04-06T14:00:00Z",
        "ANCHOR_PUBLISHED:2026-04-06T15:00:00Z",
    ]

    print("Step 1: Build Merkle tree from audit events")
    print("-" * 40)
    root, tree = build_merkle_tree(audit_events)
    print(f"  Events: {len(audit_events)}")
    print(f"  Root:   {root[:16]}...")
    print()

    # Pick an event to prove
    target_event = "FREEZE_RESOLVED:2026-04-06T12:00:00Z"

    print("Step 2: Generate inclusion proof for one event")
    print("-" * 40)
    print(f"  Target: {target_event}")
    proof = generate_inclusion_proof(target_event, audit_events)
    print(f"  Proof path length: {len(proof)}")
    print()

    print("Step 3: Verify inclusion (anyone can do this)")
    print("-" * 40)
    is_valid = verify_inclusion(target_event, proof, root)
    print(f"  Leaf: {target_event}")
    print(f"  Root: {root[:16]}...")
    print(f"  Result: {'✅ VERIFIED' if is_valid else '❌ FAILED'}")
    print()

    print("Step 4: Try with tampered event")
    print("-" * 40)
    tampered_event = "FREEZE_RESOLVED:2026-04-06T12:00:01Z"  # Changed timestamp
    is_valid_tampered = verify_inclusion(tampered_event, proof, root)
    print(f"  Tampered: {tampered_event}")
    print(f"  Result: {'✅ VERIFIED' if is_valid_tampered else '❌ FAILED (as expected)'}")
    print()

    print("=" * 60)
    print("What This Proves:")
    print("-" * 40)
    print("  - The event exists in the anchored audit log")
    print("  - Only the leaf and sibling path are revealed")
    print("  - The full dataset remains private")
    print("  - Any modification breaks verification")
    print()
    print("This is the foundation for zero-knowledge audit verification.")
    print("=" * 60)


if __name__ == "__main__":
    main()
